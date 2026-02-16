"""
CV App - Views for CV data management
"""
from rest_framework import generics, permissions
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
