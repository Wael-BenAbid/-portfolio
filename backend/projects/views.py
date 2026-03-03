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

from .models import Project, Skill, MediaItem
from .serializers import ProjectSerializer, SkillSerializer, MediaItemCreateSerializer


# ============ Pagination ============

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100  # Allow reasonable page size for users


# ============ Project Views ============

@method_decorator(cache_page(60 * 15), name='dispatch')  # Cache for 15 minutes
@method_decorator(ratelimit(key='user', rate=os.environ.get('PROJECT_CREATE_RATE_LIMIT', '100/h'), method='POST'), name='dispatch')
class ProjectListCreate(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        # Only return active projects for anonymous users or non-admin users
        if self.request.user.is_authenticated and self.request.user.is_admin():
            return Project.objects.select_related('created_by').prefetch_related('media')
        return Project.objects.select_related('created_by').prefetch_related('media').filter(is_active=True)
    
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
    serializer_class = ProjectSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        # Only return active projects for anonymous users or non-admin users
        if self.request.user.is_authenticated and self.request.user.is_admin():
            return Project.objects.select_related('created_by').prefetch_related('media')
        return Project.objects.select_related('created_by').prefetch_related('media').filter(is_active=True)

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


# ============ Media Item Views ============

@method_decorator(ratelimit(key='user', rate=os.environ.get('MEDIA_UPLOAD_RATE_LIMIT', '50/h'), method='POST'), name='dispatch')
class MediaItemCreate(generics.CreateAPIView):
    """View for creating media items for a project"""
    serializer_class = MediaItemCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def handle_exception(self, exc):
        if isinstance(exc, Ratelimited):
            return Response(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return super().handle_exception(exc)
    
    def perform_create(self, serializer):
        # The serializer already handles the project association
        serializer.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Get the saved instance directly from save() method
        media_item = self.perform_create(serializer)
        # Return data in format matching MediaItemSerializer
        from .serializers import MediaItemSerializer
        response_serializer = MediaItemSerializer(media_item, context={'request': request})
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        # Return the saved instance
        return serializer.save()


@method_decorator(ratelimit(key='user', rate=os.environ.get('MEDIA_DELETE_RATE_LIMIT', '50/h'), method='DELETE'), name='dispatch')
class MediaItemDelete(generics.DestroyAPIView):
    """View for deleting media items from a project"""
    queryset = MediaItem.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def handle_exception(self, exc):
        if isinstance(exc, Ratelimited):
            return Response(
                {'detail': 'Rate limit exceeded. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return super().handle_exception(exc)
