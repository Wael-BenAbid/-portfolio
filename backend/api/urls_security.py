"""
Security URLs - Login Activities, Activity Logs, Security Alerts
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for security ViewSets
router = DefaultRouter()
router.register(r'login-activities', views.LoginActivityViewSet, basename='login-activity')
router.register(r'activity-logs', views.ActivityLogViewSet, basename='activity-log')
router.register(r'alerts', views.SecurityAlertViewSet, basename='security-alert')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]
