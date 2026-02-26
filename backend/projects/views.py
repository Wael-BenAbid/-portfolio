"""
Projects App - Views for projects and media management
"""
from rest_framework import generics, permissions, pagination, status
from rest_framework.response import Response
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
import os

from .models import Project, Skill
from .serializers import ProjectSerializer, SkillSerializer


# ============ Pagination ============

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100  # Allow reasonable page size for users


# ============ Project Views ============

@method_decorator(cache_page(60 * 15), name='dispatch')  # Cache for 15 minutes
@method_decorator(ratelimit(key='user', rate=os.environ.get('PROJECT_CREATE_RATE_LIMIT', '100/h'), method='POST'), name='dispatch')
class ProjectListCreate(generics.ListCreateAPIView):
    queryset = Project.objects.select_related('created_by')
    serializer_class = ProjectSerializer
    pagination_class = StandardResultsSetPagination
    
    def handle_exception(self, exc):
        if isinstance(exc, Ratelimited):
            return Response(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return super().handle_exception(exc)

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
