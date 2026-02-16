"""
Projects App - URL routes for projects and media
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProjectListCreate.as_view(), name='project-list-create'),
    path('<slug:slug>/', views.ProjectRetrieveUpdateDestroy.as_view(), name='project-detail'),
    
    # Skills
    path('skills/', views.SkillListCreate.as_view(), name='skill-list-create'),
    path('skills/<int:pk>/', views.SkillRetrieveUpdateDestroy.as_view(), name='skill-detail'),
]
