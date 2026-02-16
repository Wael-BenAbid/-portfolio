"""
Content App - Views for site content
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import SiteSettings, About, ContactMessage, EmailSubscription
from .serializers import (
    SiteSettingsSerializer, AboutSerializer,
    ContactMessageSerializer, EmailSubscriptionSerializer
)


# ============ Site Settings Views ============

class SiteSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = SiteSettingsSerializer
    
    def get_object(self):
        return SiteSettings.get_settings()
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def update(self, request, *args, **kwargs):
        if request.user.user_type != 'admin':
            return Response({'error': 'Only admins can update settings'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


# ============ About Views ============

class AboutListCreate(generics.ListCreateAPIView):
    queryset = About.objects.all()
    serializer_class = AboutSerializer


class AboutRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = About.objects.all()
    serializer_class = AboutSerializer


# ============ Contact Views ============

class ContactMessageCreate(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class ContactMessageList(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return ContactMessage.objects.all()
        return ContactMessage.objects.filter(user=user)


class ContactMessageReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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

class EmailSubscriptionView(generics.CreateAPIView):
    queryset = EmailSubscription.objects.all()
    serializer_class = EmailSubscriptionSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
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


class UnsubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
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
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if 'image' not in request.FILES:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image = request.FILES['image']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_types:
            return Response({'error': 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique filename
        ext = image.name.split('.')[-1]
        filename = f'uploads/{uuid.uuid4()}.{ext}'
        
        # Save file
        saved_path = default_storage.save(filename, ContentFile(image.read()))
        
        # Return the full URL
        from django.conf import settings
        image_url = f'http://localhost:8000{settings.MEDIA_URL}{saved_path}'
        
        return Response({
            'url': image_url,
            'filename': saved_path
        }, status=status.HTTP_201_CREATED)
