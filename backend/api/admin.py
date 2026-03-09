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
        'anonymized_ip', 'user_agent', 'path', 'session_key', 'user',
        'visit_time', 'is_unique', 'device_type', 'browser', 'os'
    ]
    list_filter = [
        'visit_time', 'is_unique', 'device_type', 'browser', 'os'
    ]
    search_fields = ['anonymized_ip', 'user_agent', 'path', 'session_key']
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


# ============================================================================
# SECURITY & LOGGING ADMIN CONFIGURATION
# ============================================================================

from .models import LoginActivity, ActivityLog, SecurityAlert
from django.utils.html import format_html


@admin.register(LoginActivity)
class LoginActivityAdmin(admin.ModelAdmin):
    """
    Admin interface for viewing login activities with filtering and search.
    """
    list_display = [
        'user_email',
        'status_badge',
        'ip_address',
        'device_type',
        'country',
        'browser',
        'created_at'
    ]
    list_filter = [
        'status',
        'device_type',
        'country',
        'unusual_location',
        'created_at'
    ]
    search_fields = ['user__email', 'ip_address']
    readonly_fields = [
        'user',
        'status',
        'ip_address',
        'user_agent',
        'device_type',
        'browser',
        'os',
        'country',
        'city',
        'created_at'
    ]
    date_hierarchy = 'created_at'
    
    def user_email(self, obj):
        return obj.user.email if obj.user else 'Unknown'
    user_email.short_description = 'User'
    
    def status_badge(self, obj):
        colors = {
            'success': '#28a745',
            'failed': '#dc3545',
            'invalid_credentials': '#ffc107',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def has_add_permission(self, request):
        return False


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    """
    Admin interface for viewing all user activities.
    """
    list_display = [
        'user_email',
        'action_badge',
        'description_short',
        'success_badge',
        'created_at'
    ]
    list_filter = [
        'action',
        'success',
        'created_at'
    ]
    search_fields = ['user__email', 'description']
    readonly_fields = [
        'user',
        'action',
        'description',
        'object_type',
        'object_id',
        'changes',
        'success',
        'error_message',
        'created_at'
    ]
    date_hierarchy = 'created_at'
    
    def user_email(self, obj):
        return obj.user.email if obj.user else 'System'
    user_email.short_description = 'User'
    
    def action_badge(self, obj):
        colors = {
            'login': '#17a2b8',
            'logout': '#6c757d',
            'password_change': '#ffc107',
            'profile_update': '#0dcaf0',
            'api_request': '#6f42c1',
            'data_create': '#28a745',
            'data_delete': '#dc3545',
            'security_alert': '#e83e8c',
        }
        color = colors.get(obj.action, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.get_action_display()
        )
    action_badge.short_description = 'Action'
    
    def description_short(self, obj):
        text = obj.description[:40] + '...' if len(obj.description) > 40 else obj.description
        return text
    description_short.short_description = 'Description'
    
    def success_badge(self, obj):
        if obj.success:
            return format_html('<span style="color: #28a745; font-weight: bold;">✓ Success</span>')
        return format_html('<span style="color: #dc3545; font-weight: bold;">✗ Failed</span>')
    success_badge.short_description = 'Status'
    
    def has_add_permission(self, request):
        return False


@admin.register(SecurityAlert)
class SecurityAlertAdmin(admin.ModelAdmin):
    """
    Admin interface for managing security alerts.
    """
    list_display = [
        'alert_type_badge',
        'severity_badge',
        'title',
        'user_email',
        'status_badge',
        'created_at'
    ]
    list_filter = [
        'severity',
        'status',
        'alert_type',
        'created_at'
    ]
    search_fields = ['user__email', 'title']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    ordering = ['-severity', '-created_at']
    
    def alert_type_badge(self, obj):
        icons = {
            'brute_force': '🔨',
            'unusual_location': '🌍',
            'custom': '⚠️',
        }
        icon = icons.get(obj.alert_type, '⚠️')
        return f"{icon} {obj.get_alert_type_display()}"
    alert_type_badge.short_description = 'Type'
    
    def severity_badge(self, obj):
        colors = {
            'low': '#6c757d',
            'medium': '#ffc107',
            'high': '#ff6b6b',
            'critical': '#dc3545'
        }
        color = colors.get(obj.severity, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_severity_display()
        )
    severity_badge.short_description = 'Severity'
    
    def status_badge(self, obj):
        colors = {
            'open': '#dc3545',
            'investigating': '#ffc107',
            'resolved': '#28a745',
            'false_positive': '#6c757d'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def user_email(self, obj):
        return obj.user.email if obj.user else 'N/A'
    user_email.short_description = 'User'
    
    def has_add_permission(self, request):
        return False
    
    actions = ['mark_investigating', 'mark_resolved']
    
    def mark_investigating(self, request, queryset):
        queryset.update(status='investigating')
    mark_investigating.short_description = "Mark as investigating"
    
    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='resolved', resolved_at=timezone.now(), resolved_by=request.user)
    mark_resolved.short_description = "Mark as resolved"
