"""
CV App - Views for CV data management
"""
from django.core.cache import cache
from rest_framework import generics, permissions, pagination
from rest_framework.views import APIView
from rest_framework.response import Response

from content.models import SiteSettings
from .models import (
    CVExperience, CVEducation, CVSkill, CVLanguage,
    CVCertification, CVProject, CVInterest
)
from .serializers import (
    CVExperienceSerializer, CVEducationSerializer, CVSkillSerializer,
    CVLanguageSerializer, CVCertificationSerializer, CVProjectSerializer,
    CVInterestSerializer
)
from api.permissions import IsAdminUser, IsAdminOrReadOnly


# ============ Cache Keys ============
CV_FULL_CACHE_KEY = 'cv:full'


# ============ Pagination ============

class CVPagination(pagination.PageNumberPagination):
    """Pagination for CV list endpoints"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CVFullView(APIView):
    """Get full CV data - Always fresh from database"""
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
        
        cv_data = {
            'personal_info': personal_info,
            'experiences': CVExperienceSerializer(
                CVExperience.objects.all().order_by('-start_date'), 
                many=True
            ).data,
            'education': CVEducationSerializer(
                CVEducation.objects.all().order_by('-start_date'), 
                many=True
            ).data,
            'skills': CVSkillSerializer(
                CVSkill.objects.all().order_by('category', 'name'), 
                many=True
            ).data,
            'languages': CVLanguageSerializer(
                CVLanguage.objects.all().order_by('name'), 
                many=True
            ).data,
            'certifications': CVCertificationSerializer(
                CVCertification.objects.all().order_by('-issue_date'), 
                many=True
            ).data,
            'projects': CVProjectSerializer(
                CVProject.objects.all().order_by('-start_date'), 
                many=True
            ).data,
            'interests': CVInterestSerializer(
                CVInterest.objects.all().order_by('name'), 
                many=True
            ).data,
        }
        
        response = Response(cv_data)
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        return response


# Experience CRUD
class CVExperienceListCreate(generics.ListCreateAPIView):
    """List CV experiences with pagination"""
    pagination_class = CVPagination
    serializer_class = CVExperienceSerializer
    
    def get_queryset(self):
        # Order by date, most recent first
        return CVExperience.objects.all().order_by('-start_date')
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        # Invalidate cache when creating
        cache.delete(CV_FULL_CACHE_KEY)
        super().perform_create(serializer)


class CVExperienceDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVExperience.objects.all()
    serializer_class = CVExperienceSerializer
    permission_classes = [IsAdminUser]
    
    def perform_update(self, serializer):
        # Invalidate cache when updating
        cache.delete(CV_FULL_CACHE_KEY)
        super().perform_update(serializer)
    
    def perform_destroy(self, instance):
        # Invalidate cache when deleting
        cache.delete(CV_FULL_CACHE_KEY)
        super().perform_destroy(instance)


# Education CRUD
class CVEducationListCreate(generics.ListCreateAPIView):
    """List CV education with pagination"""
    pagination_class = CVPagination
    serializer_class = CVEducationSerializer
    
    def get_queryset(self):
        # Order by date, most recent first
        return CVEducation.objects.all().order_by('-start_date')
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        # Invalidate cache when creating
        cache.delete(CV_FULL_CACHE_KEY)
        super().perform_create(serializer)


class CVEducationDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVEducation.objects.all()
    serializer_class = CVEducationSerializer
    permission_classes = [IsAdminUser]
    
    def perform_update(self, serializer):
        # Invalidate cache when updating
        cache.delete(CV_FULL_CACHE_KEY)
        super().perform_update(serializer)
    
    def perform_destroy(self, instance):
        # Invalidate cache when deleting
        cache.delete(CV_FULL_CACHE_KEY)
        super().perform_destroy(instance)


# Skill CRUD
class CVSkillListCreate(generics.ListCreateAPIView):
    """List CV skills with pagination"""
    pagination_class = CVPagination
    serializer_class = CVSkillSerializer
    
    def get_queryset(self):
        # Order by category, then name
        return CVSkill.objects.all().order_by('category', 'name')
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        # Invalidate cache when creating
        cache.delete(CV_FULL_CACHE_KEY)
        super().perform_create(serializer)


class CVSkillDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVSkill.objects.all()
    serializer_class = CVSkillSerializer
    permission_classes = [IsAdminUser]
    
    def perform_update(self, serializer):
        # Invalidate cache when updating
        cache.delete(CV_FULL_CACHE_KEY)
        super().perform_update(serializer)
    
    def perform_destroy(self, instance):
        # Invalidate cache when deleting
        cache.delete(CV_FULL_CACHE_KEY)
        super().perform_destroy(instance)


# Language CRUD
class CVLanguageListCreate(generics.ListCreateAPIView):
    queryset = CVLanguage.objects.all()
    serializer_class = CVLanguageSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class CVLanguageDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVLanguage.objects.all()
    serializer_class = CVLanguageSerializer
    permission_classes = [IsAdminUser]


# Certification CRUD
class CVCertificationListCreate(generics.ListCreateAPIView):
    queryset = CVCertification.objects.all()
    serializer_class = CVCertificationSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class CVCertificationDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVCertification.objects.all()
    serializer_class = CVCertificationSerializer
    permission_classes = [IsAdminUser]


# CV Project CRUD
class CVProjectListCreate(generics.ListCreateAPIView):
    queryset = CVProject.objects.all()
    serializer_class = CVProjectSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class CVProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVProject.objects.all()
    serializer_class = CVProjectSerializer
    permission_classes = [IsAdminUser]


# Interest CRUD
class CVInterestListCreate(generics.ListCreateAPIView):
    queryset = CVInterest.objects.all()
    serializer_class = CVInterestSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class CVInterestDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = CVInterest.objects.all()
    serializer_class = CVInterestSerializer
    permission_classes = [IsAdminUser]
