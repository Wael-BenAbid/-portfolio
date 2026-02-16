"""
API URL Configuration - Authentication and User Management
"""
from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/social/', views.SocialAuthView.as_view(), name='social-auth'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    
    # User Profile
    path('auth/profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('auth/profile/update/', views.UserSettingsView.as_view(), name='user-settings'),
    path('auth/password/change/', views.PasswordChangeView.as_view(), name='password-change'),
    
    # Admin User Management
    path('auth/admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('auth/admin/users/<int:pk>/', views.AdminUserUpdateView.as_view(), name='admin-user-update'),
]
