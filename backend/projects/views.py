"""
Projects App - Views for projects and media management
"""
from rest_framework import generics, permissions, pagination
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from .models import Project, Skill
from .serializers import ProjectSerializer, SkillSerializer


# ============ Pagination ============

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# ============ Project Views ============

@method_decorator(cache_page(60 * 15), name='dispatch')  # Cache for 15 minutes
class ProjectListCreate(generics.ListCreateAPIView):
    queryset = Project.objects.select_related('created_by')
    serializer_class = ProjectSerializer
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.select_related('created_by')
    serializer_class = ProjectSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


# ============ Skill Views ============

@method_decorator(cache_page(60 * 30), name='dispatch')  # Cache for 30 minutes
class SkillListCreate(generics.ListCreateAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class SkillRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
