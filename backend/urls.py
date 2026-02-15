"""
API URLs for backend app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('projects/', views.ProjectListCreate.as_view(), name='project-list-create'),
    path('projects/<slug:slug>/', views.ProjectRetrieveUpdateDestroy.as_view(), name='project-detail'),
    path('skills/', views.SkillListCreate.as_view(), name='skill-list-create'),
    path('skills/<int:pk>/', views.SkillRetrieveUpdateDestroy.as_view(), name='skill-detail'),
    path('about/', views.AboutListCreate.as_view(), name='about-list-create'),
    path('about/<int:pk>/', views.AboutRetrieveUpdateDestroy.as_view(), name='about-detail'),
]
