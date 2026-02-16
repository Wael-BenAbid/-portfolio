"""
Projects App - Admin configuration
"""
from django.contrib import admin
from .models import Project, MediaItem, Skill


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_featured', 'is_active', 'created_at']
    list_filter = ['category', 'is_featured', 'is_active']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ['title']}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MediaItem)
class MediaItemAdmin(admin.ModelAdmin):
    list_display = ['project', 'media_type', 'order', 'created_at']
    list_filter = ['media_type']
    ordering = ['project', 'order']


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'proficiency', 'order']
    list_filter = ['category']
    ordering = ['order', 'name']
