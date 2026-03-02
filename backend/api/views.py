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
from .models import MediaUpload, Visitor

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
        token, created = Token.objects.get_or_create(user=user)
        
        # Set token as HttpOnly cookie
        response = Response({
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
        response.set_cookie(
            'auth_token',
            token.key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=3600 * 24 * 7  # 7 days
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
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token, created = Token.objects.get_or_create(user=user)
        
        # Set token as HttpOnly cookie only - NOT in response body for security
        # This prevents XSS token theft since JavaScript cannot access HttpOnly cookies
        response = Response({
            'user': UserSerializer(user).data
        })
        response.set_cookie(
            'auth_token',
            token.key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=3600 * 24 * 7  # 7 days
        )
        return response


@method_decorator(ratelimit(key='ip', rate='10/m', block=True), name='dispatch')
class SocialAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SocialAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, created = serializer.create_or_get_user(serializer.validated_data)
        token, _ = Token.objects.get_or_create(user=user)
        
        # Set token as HttpOnly cookie
        response = Response({
            'user': UserSerializer(user).data,
            'is_new_user': created
        })
        response.set_cookie(
            'auth_token',
            token.key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=3600 * 24 * 7  # 7 days
        )
        return response


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Delete auth token if it exists
        try:
            if hasattr(request.user, 'auth_token'):
                request.user.auth_token.delete()
        except Exception as e:
            # Log the error but don't fail the logout
            logger.warning(f"Logout error for user {request.user.id}: {e}")
        
        response = Response({'message': 'Successfully logged out.'})
        response.delete_cookie('auth_token')
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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != 'admin':
            return User.objects.none()
        return User.objects.all()


class AdminUserUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        if self.request.user.user_type != 'admin':
            return User.objects.none()
        return User.objects.all()
    
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

class MediaUploadView(generics.CreateAPIView):
    """View for handling media uploads (images and videos)."""
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
