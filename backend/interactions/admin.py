"""
Interactions App - Admin configuration
"""
from django.contrib import admin
from .models import Like, Notification


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'content_type', 'content_id', 'created_at']
    list_filter = ['content_type']
    search_fields = ['user__email']
    readonly_fields = ['created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'notification_type', 'created_at']
    list_filter = ['notification_type']
    search_fields = ['title', 'message']
    readonly_fields = ['created_at']
    filter_horizontal = ['recipients', 'is_read']
