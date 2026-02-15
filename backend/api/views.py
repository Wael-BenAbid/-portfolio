"""
API Views for backend app.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Project, Skill, About, Like, ContactMessage, Notification, EmailSubscription, MediaItem, SiteSettings, CVExperience, CVEducation, CVSkill, CVLanguage, CVCertification, CVProject, CVInterest
from .serializers import (
    UserSerializer, UserRegistrationSerializer, SocialAuthSerializer,
    ProjectSerializer, SkillSerializer, AboutSerializer, LikeSerializer,
    ContactMessageSerializer, NotificationSerializer, EmailSubscriptionSerializer,
    SiteSettingsSerializer, CVExperienceSerializer, CVEducationSerializer,
    CVSkillSerializer, CVLanguageSerializer, CVCertificationSerializer,
    CVProjectSerializer, CVInterestSerializer, CVFullSerializer
)

User = get_user_model()


# ============ Authentication Views ============

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        
        print(f"Login attempt - Email: {email}, Password length: {len(password)}")
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            print(f"User found: {user.email}, user_type: {user.user_type}")
        except User.DoesNotExist:
            print(f"User not found for email: {email}")
            return Response({
                'error': 'Invalid email or password.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(password):
            print(f"Invalid password for user: {email}")
            return Response({
                'error': 'Invalid email or password.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token, created = Token.objects.get_or_create(user=user)
        print(f"Login successful for user: {email}")
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })


class SocialAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SocialAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, created = serializer.create_or_get_user(serializer.validated_data)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'is_new_user': created
        })


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass
        return Response({'message': 'Successfully logged out.'})


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


# ============ Project Views ============

class ProjectListCreate(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


# ============ Skill Views ============

class SkillListCreate(generics.ListCreateAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class SkillRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer


# ============ About Views ============

class AboutListCreate(generics.ListCreateAPIView):
    queryset = About.objects.all()
    serializer_class = AboutSerializer


class AboutRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = About.objects.all()
    serializer_class = AboutSerializer


# ============ Like Views ============

class ToggleLikeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, content_type, content_id):
        user = request.user
        
        if content_type == 'project':
            content_obj = get_object_or_404(Project, id=content_id)
            like_filter = {'user': user, 'project': content_obj}
        elif content_type == 'media':
            content_obj = get_object_or_404(MediaItem, id=content_id)
            like_filter = {'user': user, 'media': content_obj}
        else:
            return Response({'error': 'Invalid content type'}, status=status.HTTP_400_BAD_REQUEST)

        like = Like.objects.filter(**like_filter).first()
        
        if like:
            like.delete()
            return Response({'liked': False, 'message': 'Like removed'})
        else:
            Like.objects.create(
                user=user,
                content_type=content_type,
                content_id=content_id,
                **{'project' if content_type == 'project' else 'media': content_obj}
            )
            return Response({'liked': True, 'message': 'Liked successfully'})


class UserLikesView(generics.ListAPIView):
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Like.objects.filter(user=self.request.user)


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


# ============ Notification Views ============

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipients=self.request.user)


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, recipients=request.user)
        notification.is_read.add(request.user)
        return Response({'message': 'Notification marked as read'})


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


# ============ Admin Views ============

class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != 'admin':
            return User.objects.none()
        return User.objects.all()


class AdminUserUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != 'admin':
            return User.objects.none()
        return User.objects.all()


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


# ============ CV Views ============

class CVFullView(APIView):
    """Get full CV data"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        settings = SiteSettings.get_settings()
        personal_info = {
            'full_name': settings.cv_full_name,
            'job_title': settings.cv_job_title,
            'email': settings.cv_email,
            'phone': settings.cv_phone,
            'location': settings.cv_location,
            'profile_image': settings.cv_profile_image,
            'summary': settings.cv_summary,
            'linkedin': settings.linkedin_url,
            'github': settings.github_url,
        }
        
        return Response({
            'personal_info': personal_info,
            'experiences': CVExperienceSerializer(CVExperience.objects.all(), many=True).data,
            'education': CVEducationSerializer(CVEducation.objects.all(), many=True).data,
            'skills': CVSkillSerializer(CVSkill.objects.all(), many=True).data,
            'languages': CVLanguageSerializer(CVLanguage.objects.all(), many=True).data,
            'certifications': CVCertificationSerializer(CVCertification.objects.all(), many=True).data,
            'projects': CVProjectSerializer(CVProject.objects.all(), many=True).data,
            'interests': CVInterestSerializer(CVInterest.objects.all(), many=True).data,
        })


# Experience CRUD
class CVExperienceListCreate(generics.ListCreateAPIView):
    queryset = CVExperience.objects.all()
    serializer_class = CVExperienceSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class CVExperienceDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVExperience.objects.all()
    serializer_class = CVExperienceSerializer
    permission_classes = [permissions.IsAuthenticated]


# Education CRUD
class CVEducationListCreate(generics.ListCreateAPIView):
    queryset = CVEducation.objects.all()
    serializer_class = CVEducationSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class CVEducationDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVEducation.objects.all()
    serializer_class = CVEducationSerializer
    permission_classes = [permissions.IsAuthenticated]


# Skill CRUD
class CVSkillListCreate(generics.ListCreateAPIView):
    queryset = CVSkill.objects.all()
    serializer_class = CVSkillSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class CVSkillDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVSkill.objects.all()
    serializer_class = CVSkillSerializer
    permission_classes = [permissions.IsAuthenticated]


# Language CRUD
class CVLanguageListCreate(generics.ListCreateAPIView):
    queryset = CVLanguage.objects.all()
    serializer_class = CVLanguageSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class CVLanguageDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVLanguage.objects.all()
    serializer_class = CVLanguageSerializer
    permission_classes = [permissions.IsAuthenticated]


# Certification CRUD
class CVCertificationListCreate(generics.ListCreateAPIView):
    queryset = CVCertification.objects.all()
    serializer_class = CVCertificationSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class CVCertificationDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVCertification.objects.all()
    serializer_class = CVCertificationSerializer
    permission_classes = [permissions.IsAuthenticated]


# CV Project CRUD
class CVProjectListCreate(generics.ListCreateAPIView):
    queryset = CVProject.objects.all()
    serializer_class = CVProjectSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class CVProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVProject.objects.all()
    serializer_class = CVProjectSerializer
    permission_classes = [permissions.IsAuthenticated]


# Interest CRUD
class CVInterestListCreate(generics.ListCreateAPIView):
    queryset = CVInterest.objects.all()
    serializer_class = CVInterestSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class CVInterestDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVInterest.objects.all()
    serializer_class = CVInterestSerializer
    permission_classes = [permissions.IsAuthenticated]
