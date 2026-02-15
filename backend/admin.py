"""
Admin configuration for backend app.
"""
from django.contrib import admin
from .models import Project, MediaItem, Skill, About


class MediaItemInline(admin.TabularInline):
    model = MediaItem
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'category', 'featured', 'created_at']
    list_filter = ['category', 'featured', 'created_at']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [MediaItemInline]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'category']
    list_filter = ['category']
    search_fields = ['name']


@admin.register(About)
class AboutAdmin(admin.ModelAdmin):
    list_display = ['id', 'bio']
    list_display_links = ['id']
