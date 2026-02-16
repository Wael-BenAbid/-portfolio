"""
CV App - Admin configuration
"""
from django.contrib import admin
from .models import (
    CVExperience, CVEducation, CVSkill, CVLanguage,
    CVCertification, CVProject, CVInterest
)


@admin.register(CVExperience)
class CVExperienceAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'start_date', 'is_current', 'order']
    list_filter = ['is_current']
    ordering = ['-order', '-start_date']


@admin.register(CVEducation)
class CVEducationAdmin(admin.ModelAdmin):
    list_display = ['degree', 'institution', 'start_date', 'is_current', 'order']
    list_filter = ['is_current']
    ordering = ['-order', '-start_date']


@admin.register(CVSkill)
class CVSkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'category', 'percentage', 'order']
    list_filter = ['level', 'category']
    ordering = ['category', '-percentage', 'order']


@admin.register(CVLanguage)
class CVLanguageAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'order']
    list_filter = ['level']
    ordering = ['order']


@admin.register(CVCertification)
class CVCertificationAdmin(admin.ModelAdmin):
    list_display = ['name', 'issuer', 'issue_date', 'order']
    ordering = ['-order', '-issue_date']


@admin.register(CVProject)
class CVProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_ongoing', 'start_date', 'order']
    list_filter = ['is_ongoing']
    ordering = ['-order', '-start_date']


@admin.register(CVInterest)
class CVInterestAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'order']
    ordering = ['order']
