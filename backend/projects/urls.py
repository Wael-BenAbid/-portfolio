"""
Projects App - URL routes for projects and media
"""
from django.urls import path
from . import views

urlpatterns = [
    # Skills
    path('skills/', views.SkillListCreate.as_view(), name='skill-list-create'),
    path('skills/<int:pk>/', views.SkillRetrieveUpdateDestroy.as_view(), name='skill-detail'),
    
    # Media Items
    path('media/create/', views.MediaItemCreate.as_view(), name='media-item-create'),
    path('media/delete/<int:pk>/', views.MediaItemDelete.as_view(), name='media-item-delete'),

    # Registrations (admin list - before slug route)
    path('registrations/', views.ProjectRegistrationListView.as_view(), name='registrations-list'),
    path('registrations/<int:pk>/status/', views.ProjectRegistrationUpdateView.as_view(), name='registration-update'),

    # Projects - Keep at end to avoid URL conflicts
    path('', views.ProjectListCreate.as_view(), name='project-list-create'),
    path('<slug:slug>/register/', views.ProjectRegisterView.as_view(), name='project-register'),
    path('<slug:slug>/register/status/', views.ProjectRegistrationStatusView.as_view(), name='project-register-status'),
    path('<slug:slug>/', views.ProjectRetrieveUpdateDestroy.as_view(), name='project-detail'),
]
