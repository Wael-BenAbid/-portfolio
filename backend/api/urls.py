"""
API URL Configuration - Authentication and User Management
"""
from django.urls import path
from . import views
from . import metrics

urlpatterns = [
    # Health Check
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
    
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', views.RefreshTokenView.as_view(), name='refresh-token'),
    path('oauth-state/', views.OAuthStateView.as_view(), name='oauth-state'),
    path('social/', views.SocialAuthView.as_view(), name='social-auth'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # User Profile
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', views.UserSettingsView.as_view(), name='user-settings'),
    path('password/change/', views.PasswordChangeView.as_view(), name='password-change'),
    
    # Admin User Management
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', views.AdminUserUpdateView.as_view(), name='admin-user-update'),

    # Image Upload
    path('upload/', views.MediaUploadView.as_view(), name='media-upload'),
    
    # Visitor Tracking
    path('visitors/stats/', views.VisitorStatsView.as_view(), name='visitor-stats'),
    path('visitors/', views.VisitorListView.as_view(), name='visitor-list'),
    
    # Prometheus Metrics
    path('metrics/', metrics.metrics_view, name='metrics'),
]
