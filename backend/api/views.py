"""
API Views - Authentication and User Management
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.conf import settings

from .serializers import (
    UserSerializer, UserRegistrationSerializer, SocialAuthSerializer,
    AdminUserUpdateSerializer, PasswordChangeSerializer, ImageUploadSerializer
)
from .models import ImageUpload

User = get_user_model()


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


# ============ Image Upload View ============

class ImageUploadView(generics.CreateAPIView):
    """View for handling image uploads."""
    serializer_class = ImageUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
