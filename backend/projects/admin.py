"""
Projects App - Admin configuration
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Project, MediaItem, Skill


class MediaItemInline(admin.TabularInline):
    """Inline admin for MediaItem to allow adding media directly in Project admin"""
    model = MediaItem
    extra = 0
    fields = ['media_type', 'file', 'thumbnail', 'caption', 'order']
    readonly_fields = ['media_preview']
    
    def media_preview(self, obj):
        """Display a preview of the uploaded media"""
        if obj.file:
            if obj.media_type == 'image':
                return format_html(
                    '<img src="{}" style="max-width: 200px; max-height: 200px; object-fit: contain;" />',
                    obj.file.url
                )
            elif obj.media_type == 'video':
                return format_html(
                    '<video src="{}" controls style="max-width: 200px; max-height: 200px;"></video>',
                    obj.file.url
                )
        return "No file uploaded"
    media_preview.short_description = 'Preview'


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'featured', 'is_active', 'created_at']
    list_filter = ['category', 'featured', 'is_active']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ['title']}
    readonly_fields = ['created_at', 'updated_at']
    inlines = [MediaItemInline]


@admin.register(MediaItem)
class MediaItemAdmin(admin.ModelAdmin):
    list_display = ['project', 'media_type', 'file_preview', 'order', 'created_at']
    list_filter = ['media_type']
    ordering = ['project', 'order']
    readonly_fields = ['media_preview']
    
    def file_preview(self, obj):
        """Display a small preview in the list view"""
        if obj.file:
            if obj.media_type == 'image':
                return format_html(
                    '<img src="{}" style="max-width: 50px; max-height: 50px; object-fit: contain;" />',
                    obj.file.url
                )
            elif obj.media_type == 'video':
                return format_html('<span>🎬 Video</span>')
        return "No file"
    file_preview.short_description = 'Preview'
    
    def media_preview(self, obj):
        """Display a preview of the uploaded media"""
        if obj.file:
            if obj.media_type == 'image':
                return format_html(
                    '<img src="{}" style="max-width: 400px; max-height: 400px; object-fit: contain;" />',
                    obj.file.url
                )
            elif obj.media_type == 'video':
                return format_html(
                    '<video src="{}" controls style="max-width: 400px; max-height: 400px;"></video>',
                    obj.file.url
                )
        return "No file uploaded"
    media_preview.short_description = 'Preview'


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'proficiency', 'order']
    list_filter = ['category']
    ordering = ['order', 'name']
