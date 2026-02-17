"""
API URL Configuration - Authentication and User Management
"""
from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('social/', views.SocialAuthView.as_view(), name='social-auth'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # User Profile
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', views.UserSettingsView.as_view(), name='user-settings'),
    path('password/change/', views.PasswordChangeView.as_view(), name='password-change'),
    
    # Admin User Management
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', views.AdminUserUpdateView.as_view(), name='admin-user-update'),
]
