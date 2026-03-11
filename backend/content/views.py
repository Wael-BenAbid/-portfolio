"""
Content App - Views for site content
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
import os

from .models import SiteSettings, About, ContactMessage, EmailSubscription
from .serializers import (
    SiteSettingsSerializer, SiteSettingsPublicSerializer, AboutSerializer,
    ContactMessageSerializer, EmailSubscriptionSerializer, SubscribeSerializer, UnsubscribeSerializer
)
from api.permissions import IsAdminUser, IsAdminOrReadOnly


# ============ Site Settings Views ============

class SiteSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = SiteSettingsSerializer
    
    def get_object(self):
        return SiteSettings.get_settings()

    def get_serializer_class(self):
        # Admin users can read/update all settings, including sensitive credentials.
        if self.request.user.is_authenticated and self.request.user.user_type == 'admin':
            return SiteSettingsSerializer
        # Public requests must not receive OAuth/SMTP secrets.
        return SiteSettingsPublicSerializer
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]
    
    def update(self, request, *args, **kwargs):
        # Check if user is authenticated first
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        # Then check if user is admin
        if request.user.user_type != 'admin':
            return Response({'error': 'Only admins can update settings'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


# ============ About Views ============

class AboutListCreate(generics.ListCreateAPIView):
    queryset = About.objects.all()
    serializer_class = AboutSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class AboutRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = About.objects.all()
    serializer_class = AboutSerializer
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]


# ============ Contact Views ============

@method_decorator(ratelimit(key='ip', rate=os.environ.get('CONTACT_RATE_LIMIT', '5/h'), method='POST', block=True), name='dispatch')
class ContactMessageCreate(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    
    def handle_exception(self, exc):
        if isinstance(exc, Ratelimited):
            return Response(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return super().handle_exception(exc)
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            instance = serializer.save(user=self.request.user)
        else:
            instance = serializer.save()
        self._send_notification_email(instance)

    def _send_notification_email(self, message):
        """Send email notification to admin when a contact message is received."""
        try:
            from django.core.mail import send_mail
            from django.conf import settings as django_settings
            from content.models import SiteSettings

            site = SiteSettings.get_settings()
            from_email = site.default_from_email or site.email_host_user
            admin_email = site.contact_email or site.email_host_user
            if not from_email or not admin_email:
                return

            send_mail(
                subject=f'Nouveau message de contact: {message.subject}',
                message=(
                    f'Nom: {message.name}\n'
                    f'Email: {message.email}\n'
                    f'Sujet: {message.subject}\n\n'
                    f'{message.message}'
                ),
                from_email=from_email,
                recipient_list=[admin_email],
                fail_silently=True,
            )
        except Exception:
            pass


class UserContactMessagesView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ContactMessage.objects.filter(user=self.request.user)


class ContactMessageList(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return ContactMessage.objects.all()


class ContactMessageReplyView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        if request.user.user_type != 'admin':
            return Response({'error': 'Only admins can reply'}, status=status.HTTP_403_FORBIDDEN)
        
        message = get_object_or_404(ContactMessage, pk=pk)
        reply = request.data.get('reply')
        
        if not reply:
            return Response({'error': 'Reply is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        message.admin_reply = reply
        message.status = 'replied'
        message.save()
        
        return Response({'message': 'Reply sent successfully'})


# ============ Email Subscription Views ============

@method_decorator(ratelimit(key='ip', rate=os.environ.get('SUBSCRIPTION_RATE_LIMIT', '5/h'), method='POST', block=True), name='dispatch')
class EmailSubscriptionView(generics.CreateAPIView):
    queryset = EmailSubscription.objects.all()
    serializer_class = EmailSubscriptionSerializer
    permission_classes = [permissions.AllowAny]
    
    def handle_exception(self, exc):
        if isinstance(exc, Ratelimited):
            return Response(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return super().handle_exception(exc)

    def create(self, request, *args, **kwargs):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        subscription, created = EmailSubscription.objects.get_or_create(
            email=email,
            defaults={'is_active': True}
        )
        if not created and not subscription.is_active:
            subscription.is_active = True
            subscription.save()
            return Response({'message': 'Re-subscribed successfully'})
        elif not created:
            return Response({'message': 'Already subscribed'}, status=status.HTTP_200_OK)
        return Response({'message': 'Subscribed successfully'}, status=status.HTTP_201_CREATED)


@method_decorator(ratelimit(key='ip', rate=os.environ.get('UNSUBSCRIBE_RATE_LIMIT', '5/h'), method='POST', block=True), name='dispatch')
class UnsubscribeView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def handle_exception(self, exc):
        if isinstance(exc, Ratelimited):
            return Response(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return super().handle_exception(exc)

    def post(self, request):
        serializer = UnsubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        try:
            subscription = EmailSubscription.objects.get(email=email)
            subscription.is_active = False
            subscription.save()
            return Response({'message': 'Unsubscribed successfully'})
        except EmailSubscription.DoesNotExist:
            return Response({'error': 'Email not found'}, status=status.HTTP_404_NOT_FOUND)


# ============ Image Upload View ============
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import uuid

class ImageUploadView(APIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image = request.FILES['image']
        
        # Validate file type using Pillow to check actual content
        try:
            from PIL import Image
            img = Image.open(image)
            img.verify()
        except Exception as e:
            return Response({'error': 'Invalid image file. Please upload a valid image (JPEG, PNG, GIF, WebP)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_types:
            return Response({'error': 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if image.size > max_size:
            return Response({'error': 'Image too large. Maximum size is 5MB'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique filename with date-based directory structure
        from datetime import datetime
        now = datetime.now()
        ext = image.name.split('.')[-1].lower()
        filename = f'uploads/{now.year}/{now.month:02d}/{now.day:02d}/{uuid.uuid4()}.{ext}'
        
        # Reset file pointer after Pillow verification
        image.seek(0)
        
        # Save file (uses Cloudinary in production, local filesystem in dev)
        saved_path = default_storage.save(filename, image)
        
        # Get the URL from the storage backend
        image_url = default_storage.url(saved_path)
        
        return Response({
            'url': image_url,
            'filename': saved_path
        }, status=status.HTTP_201_CREATED)
