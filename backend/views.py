"""
API Views for backend app.
"""
from rest_framework import generics
from .models import Project, Skill, About
from .serializers import ProjectSerializer, SkillSerializer, AboutSerializer


class ProjectListCreate(generics.ListCreateAPIView):
    """
    API view to list all projects or create a new project.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class ProjectRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update or delete a project by slug.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    lookup_field = 'slug'


class SkillListCreate(generics.ListCreateAPIView):
    """
    API view to list all skills or create a new skill.
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer


class SkillRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update or delete a skill.
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer


class AboutListCreate(generics.ListCreateAPIView):
    """
    API view to list all about entries or create a new one.
    """
    queryset = About.objects.all()
    serializer_class = AboutSerializer


class AboutRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update or delete an about entry.
    """
    queryset = About.objects.all()
    serializer_class = AboutSerializer
