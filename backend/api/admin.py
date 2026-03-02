"""
Admin configuration for backend app.
"""
from django.contrib import admin
from .models import Visitor, MediaUpload
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    """Admin configuration for Visitor model."""
    list_display = [
        'ip_address', 'user_agent', 'path', 'session_key', 'user',
        'visit_time', 'is_unique', 'device_type', 'browser', 'os'
    ]
    list_filter = [
        'visit_time', 'is_unique', 'device_type', 'browser', 'os'
    ]
    search_fields = ['ip_address', 'user_agent', 'path', 'session_key']
    date_hierarchy = 'visit_time'
    list_per_page = 25


@admin.register(MediaUpload)
class MediaUploadAdmin(admin.ModelAdmin):
    """Admin configuration for MediaUpload model."""
    list_display = ['id', 'file', 'uploaded_at', 'uploaded_by']
    list_filter = ['uploaded_at', 'uploaded_by']
    search_fields = ['uploaded_by__email']


try:
    admin.site.unregister(CustomUser)
except admin.sites.NotRegistered:
    pass

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Custom User Admin."""
    model = CustomUser
    list_display = ['email', 'first_name', 'last_name', 'user_type', 'is_staff', 'is_active']
    list_filter = ['user_type', 'is_staff', 'is_active', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
