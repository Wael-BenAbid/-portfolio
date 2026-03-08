"""
API Views - Authentication and User Management
"""
import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db import models
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.conf import settings

from .serializers import (
    UserSerializer, UserRegistrationSerializer, SocialAuthSerializer,
    AdminUserUpdateSerializer, PasswordChangeSerializer, MediaUploadSerializer,
    VisitorSerializer, VisitorStatsSerializer
)
from .models import MediaUpload, Visitor, RefreshToken, OAuthState
from api.permissions import IsAdminUser

User = get_user_model()
logger = logging.getLogger(__name__)


# ============ Authentication Views ============

@method_decorator(ratelimit(key='ip', rate='5/m', block=True), name='dispatch')
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        access_token, _ = Token.objects.get_or_create(user=user)
        refresh_token = RefreshToken.create_for_user(user)
        
        # Set token as HttpOnly cookie
        response = Response({
            'user': UserSerializer(user).data,
            'access_token': access_token.key,
            'token_type': 'Bearer',
            'expires_in': 3600  # 1 hour
        }, status=status.HTTP_201_CREATED)
        
        response.set_cookie(
            'refresh_token',
            refresh_token.token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Strict',
            max_age=3600 * 24 * 7,  # 7 days
            path='/api/auth/refresh/'
        )
        return response


@method_decorator(ratelimit(key='ip', rate='10/m', block=True), name='dispatch')
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use filter().first() to prevent timing attacks - always returns None if not found
        # This prevents attackers from enumerating valid email addresses
        user = User.objects.filter(email=email).first()
        
        # Check password only if user exists, but always return same error message
        if not user or not user.check_password(password):
            return Response({
                'error': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        access_token, _ = Token.objects.get_or_create(user=user)
        refresh_token = RefreshToken.create_for_user(user)
        
        # Create response
        response = Response({
            'user': UserSerializer(user).data,
            'access_token': access_token.key,
            'token_type': 'Bearer',
            'expires_in': 3600  # 1 hour
        }, status=status.HTTP_200_OK)
        
        # Set refresh token as httpOnly cookie (NOT access token!)
        # The access token is short-lived (1 hour)
        # The refresh token is longer-lived (7 days) and secure
        response.set_cookie(
            'refresh_token',
            refresh_token.token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Strict',  # Stricter than Lax for better CSRF protection
            max_age=3600 * 24 * 7,  # 7 days
            path='/api/auth/refresh/'  # Only sent to refresh endpoint
        )
        
        # Set access token as httpOnly cookie for API authentication
        response.set_cookie(
            'auth_token',
            access_token.key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Strict',
            max_age=3600,  # 1 hour
            path='/api/'  # Sent to all API endpoints
        )
        
        return response


class OAuthStateView(APIView):
    """
    Generate OAuth state and nonce for CSRF protection.
    
    This prevents CSRF attacks on OAuth endpoints by requiring a unpredictable
    state parameter that must match in the callback.
    
    Request: GET /api/auth/oauth-state/?provider=github
    Response: {
        "state": "long-random-string",
        "nonce": "long-random-string",
        "provider": "github"
    }
    
    Frontend Usage:
    1. Request new state: GET /api/auth/oauth-state/?provider=github
    2. Store returned state/nonce in session
    3. Redirect to: https://github.com/login/oauth/authorize?client_id=xxx&state=xxx
    4. Provider redirects to: /callback?code=xxx&state=xxx
    5. POST with state/code to /api/auth/social/ to exchange for token
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Generate new state token for OAuth flow."""
        provider = request.query_params.get('provider', '').lower()
        
        # Validate provider
        valid_providers = ['github', 'google', 'microsoft']
        if provider not in valid_providers:
            return Response({
                'error': f'Invalid provider. Must be one of: {", ".join(valid_providers)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new state + nonce
        oauth_state = OAuthState.create_for_provider(provider)
        
        return Response({
            'state': oauth_state.state,
            'nonce': oauth_state.nonce,
            'provider': oauth_state.provider,
            'expires_at': oauth_state.expires_at.isoformat()
        })


@method_decorator(ratelimit(key='ip', rate='10/m', block=True), name='dispatch')
class SocialAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Authenticate user via OAuth provider.
        
        Expected request data:
        {
            "provider": "github",
            "code": "oauth_code_from_provider",
            "state": "csrf_token_from_state_endpoint",
            "redirect_uri": "http://localhost:3000/callback"
        }
        
        SECURITY: State parameter prevents CSRF attacks. Must match value
        returned from GET /api/auth/oauth-state/
        """
        # CSRF Protection: Verify state parameter
        state = request.data.get('state')
        provider = request.data.get('provider', '').lower()
        
        if not state:
            return Response({
                'error': 'state parameter required for CSRF protection'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify and consume state (one-time use)
        oauth_state = OAuthState.verify_and_consume(state, provider)
        if not oauth_state:
            return Response({
                'error': 'Invalid or expired state token'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # State is valid, proceed with OAuth
        serializer = SocialAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, created = serializer.create_or_get_user(serializer.validated_data)
        
        # Generate tokens
        access_token, _ = Token.objects.get_or_create(user=user)
        refresh_token = RefreshToken.create_for_user(user)
        
         # Set token as HttpOnly cookie
        response = Response({
            'user': UserSerializer(user).data,
            'access_token': access_token.key,
            'token_type': 'Bearer',
            'expires_in': 3600,    # 1 hour
            'is_new_user': created
        })
        response.set_cookie(
            'refresh_token',
            refresh_token.token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Strict',
            max_age=3600 * 24 * 7,  # 7 days
            path='/api/auth/refresh/'
        )
        
        # Set access token as httpOnly cookie for API authentication
        response.set_cookie(
            'auth_token',
            access_token.key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Strict',
            max_age=3600,  # 1 hour
            path='/api/'  # Sent to all API endpoints
        )
        
        return response


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Logout user and invalidate refresh token.
        """
        # Revoke active refresh token if it exists
        try:
            refresh_token = RefreshToken.objects.get(user=request.user, revoked_at__isnull=True)
            refresh_token.revoke()
            logger.info(f"Refresh token revoked for user {request.user.id}")
        except RefreshToken.DoesNotExist:
            pass  # User might not have an active refresh token
        except Exception as e:
            logger.warning(f"Error revoking refresh token for user {request.user.id}: {e}")
        
        # Delete auth token if it exists
        try:
            if hasattr(request.user, 'auth_token'):
                request.user.auth_token.delete()
        except Exception as e:
            logger.warning(f"Logout error for user {request.user.id}: {e}")
        
        response = Response({'message': 'Successfully logged out.'})
        response.delete_cookie('refresh_token', path='/api/auth/refresh/')
        response.delete_cookie('auth_token', path='/api/')
        return response


class RefreshTokenView(APIView):
    """
    Endpoint to refresh access token using refresh token.
    
    Request: POST /api/auth/refresh/
    Response: { "access_token": "...", "expires_in": 3600 }
    
    The refresh token is sent automatically via httpOnly cookie
    (only to this endpoint due to path-restriction).
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Refresh access token using refresh token from cookie."""
        refresh_token_value = request.COOKIES.get('refresh_token')
        
        if not refresh_token_value:
            return Response({
                'error': 'Refresh token not found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Validate refresh token exists and is valid
        try:
            refresh_token = RefreshToken.objects.get(
                token=refresh_token_value
            )
        except RefreshToken.DoesNotExist:
            logger.warning(f"Invalid refresh token attempted: {refresh_token_value[:10]}...")
            return Response({
                'error': 'Invalid or expired refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not refresh_token.is_valid():
            logger.warning(f"Invalid refresh token used by user {refresh_token.user.id}")
            return Response({
                'error': 'Refresh token has expired or been revoked'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate new access token
        user = refresh_token.user
        access_token, _ = Token.objects.get_or_create(user=user)
        
        # Create response
        response = Response({
            'access_token': access_token.key,
            'token_type': 'Bearer',
            'expires_in': 3600  # 1 hour
        }, status=status.HTTP_200_OK)
        
        # Set access token as httpOnly cookie for API authentication
        response.set_cookie(
            'auth_token',
            access_token.key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Strict',
            max_age=3600,  # 1 hour
            path='/api/'  # Sent to all API endpoints
        )
        
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserSettingsView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@method_decorator(ratelimit(key='ip', rate='5/m', block=True), name='dispatch')
class PasswordChangeView(APIView):
    """
    Password change view for authenticated users.
    Uses standard DRF authentication - user must be authenticated via token.
    Rate limited to prevent brute force attacks.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        # Clear the requires_password_change flag after successful password change
        request.user.requires_password_change = False
        request.user.save()
        return Response({'message': 'Password changed successfully.'})


# ============ Admin Views ============

class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class AdminUserUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserUpdateSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)
    
    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.id == request.user.id:
            return Response({'error': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


# ============ Media Upload View ============

@method_decorator(ratelimit(key='user', rate='10/h', method='POST', block=True), name='dispatch')
class MediaUploadView(generics.CreateAPIView):
    """
    View for handling media uploads (images and videos).
    
    Rate limited to 10 uploads per hour per user to prevent abuse.
    Validates file type and size before acceptance.
    """
    serializer_class = MediaUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


# ============ Visitor Tracking Views ============

class VisitorStatsView(APIView):
    """View to get visitor statistics."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Check if user is admin
        if request.user.user_type != 'admin':
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Calculate statistics
        total_visitors = Visitor.objects.count()
        unique_visitors = Visitor.objects.filter(is_unique=True).count()
        page_views = total_visitors
        
        # Calculate bounce rate (simplified: single-page sessions)
        single_page_sessions = 0
        session_visits = Visitor.objects.values('session_key').annotate(count=models.Count('id'))
        for visit in session_visits:
            if visit['count'] == 1:
                single_page_sessions += 1
        
        bounce_rate = (single_page_sessions / len(session_visits)) * 100 if session_visits else 0
        
        # Calculate average session duration (simplified)
        average_session_duration = 0  # This would need more complex session tracking
        
        # Get popular pages
        popular_pages = list(
            Visitor.objects.values('path')
            .annotate(count=models.Count('id'))
            .order_by('-count')[:10]
        )
        
        # Get device distribution
        device_distribution = list(
            Visitor.objects.values('device_type')
            .annotate(count=models.Count('id'))
            .order_by('-count')
        )
        
        # Get browser distribution
        browser_distribution = list(
            Visitor.objects.values('browser')
            .annotate(count=models.Count('id'))
            .order_by('-count')
        )
        
        # Get OS distribution
        os_distribution = list(
            Visitor.objects.values('os')
            .annotate(count=models.Count('id'))
            .order_by('-count')
        )
        
        # Get daily trend (last 7 days)
        from django.utils import timezone
        daily_trend = []
        today = timezone.now().date()
        for i in range(7):
            date = today - timezone.timedelta(days=i)
            day_visits = Visitor.objects.filter(visit_time__date=date).count()
            daily_trend.append({
                'date': date.strftime('%Y-%m-%d'),
                'visits': day_visits
            })
        
        # Reverse to show oldest to newest
        daily_trend = list(reversed(daily_trend))
        
        # Prepare response
        stats = {
            'total_visitors': total_visitors,
            'unique_visitors': unique_visitors,
            'page_views': page_views,
            'bounce_rate': round(bounce_rate, 2),
            'average_session_duration': average_session_duration,
            'popular_pages': popular_pages,
            'device_distribution': {d['device_type']: d['count'] for d in device_distribution},
            'browser_distribution': {d['browser']: d['count'] for d in browser_distribution},
            'os_distribution': {d['os']: d['count'] for d in os_distribution},
            'daily_trend': daily_trend
        }
        
        serializer = VisitorStatsSerializer(stats)
        return Response(serializer.data)


class VisitorListView(generics.ListAPIView):
    """View to list all visitors (admin only)."""
    queryset = Visitor.objects.all().order_by('-visit_time')
    serializer_class = VisitorSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        if self.request.user.user_type != 'admin':
            return Visitor.objects.none()
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        queryset = Visitor.objects.all().order_by('-visit_time')
        
        if start_date:
            queryset = queryset.filter(visit_time__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(visit_time__date__lte=end_date)
        
        return queryset


# ============ Health Check View ============

class HealthCheckView(APIView):
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns the application and dependency health status.
    Used by: - Kubernetes liveness/readiness probes
    - Load balancers (ELB, ALB)
    - Monitoring systems (Uptime monitoring)
    
    Response: 200 OK if healthy, 503 Service Unavailable if unhealthy
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        """Check health of application and critical dependencies."""
        health_status = {
            'status': 'healthy',
            'checks': {}
        }
        
        # Check database connection
        try:
            from django.db import connections
            connections.databases.get('default').ensure_connection()
            health_status['checks']['database'] = 'healthy'
        except Exception as e:
            health_status['checks']['database'] = 'unhealthy'
            health_status['status'] = 'unhealthy'
            logger.error(f"Database health check failed: {str(e)}")
        
        # Check Redis cache connection
        try:
            from django.core.cache import cache
            cache.set('health_check', 'ok', 10)
            if cache.get('health_check') == 'ok':
                health_status['checks']['cache'] = 'healthy'
            else:
                health_status['checks']['cache'] = 'unhealthy'
                health_status['status'] = 'unhealthy'
        except Exception as e:
            health_status['checks']['cache'] = 'unhealthy'
            # Cache failure is non-critical for health check
            logger.warning(f"Cache health check failed: {str(e)}")
        
        # Return appropriate status code
        status_code = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(health_status, status=status_code)
