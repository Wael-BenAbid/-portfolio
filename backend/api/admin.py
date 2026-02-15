"""
Admin configuration for backend app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import (
    Project, MediaItem, Skill, About, Like, ContactMessage, Notification, 
    EmailSubscription, SiteSettings, CVExperience, CVEducation, CVSkill, 
    CVLanguage, CVCertification, CVProject, CVInterest
)

User = get_user_model()


class UserAdmin(BaseUserAdmin):
    ordering = ['email']
    list_display = ['email', 'user_type', 'first_name', 'last_name', 'is_staff', 'is_active']
    list_filter = ['user_type', 'is_staff', 'is_active', 'auth_provider']
    search_fields = ['email', 'first_name', 'last_name']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'bio', 'phone', 'profile_image')}),
        ('User Type', {'fields': ('user_type',)}),
        ('Social Auth', {'fields': ('google_id', 'facebook_id', 'auth_provider')}),
        ('Notifications', {'fields': ('email_notifications', 'notify_new_projects', 'notify_updates')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'user_type', 'is_staff', 'is_active'),
        }),
    )


class MediaItemInline(admin.TabularInline):
    model = MediaItem
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'category', 'featured', 'created_at', 'created_by']
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


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'content_type', 'content_id', 'created_at']
    list_filter = ['content_type', 'created_at']
    search_fields = ['user__email']


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'email', 'subject']
    readonly_fields = ['created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'notification_type', 'created_at']
    list_filter = ['notification_type', 'created_at']
    search_fields = ['title', 'message']
    filter_horizontal = ['recipients', 'is_read']


@admin.register(EmailSubscription)
class EmailSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_active', 'subscribed_at']
    list_filter = ['is_active', 'subscribed_at']
    search_fields = ['email']


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ['site_name', 'contact_email', 'location']
    fieldsets = (
        ('Site Information', {
            'fields': ('site_name', 'site_description')
        }),
        ('Social Media', {
            'fields': ('instagram_url', 'linkedin_url', 'github_url', 'twitter_url')
        }),
        ('OAuth Settings', {
            'fields': ('google_client_id', 'google_client_secret', 'facebook_app_id', 'facebook_app_secret'),
            'classes': ('collapse',),
        }),
        ('Email Settings', {
            'fields': ('email_host', 'email_port', 'email_host_user', 'email_host_password', 'default_from_email'),
            'classes': ('collapse',),
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone', 'location')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',),
        }),
    )

    def has_add_permission(self, request):
        # Only allow one instance
        if SiteSettings.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False


# Register the custom User model
admin.site.register(User, UserAdmin)


# ============ CV Admin Classes ============

@admin.register(CVExperience)
class CVExperienceAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'start_date', 'is_current', 'order']
    list_filter = ['is_current']
    search_fields = ['title', 'company', 'description']


@admin.register(CVEducation)
class CVEducationAdmin(admin.ModelAdmin):
    list_display = ['degree', 'institution', 'start_date', 'is_current', 'order']
    list_filter = ['is_current']
    search_fields = ['degree', 'institution', 'description']


@admin.register(CVSkill)
class CVSkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'category', 'percentage', 'order']
    list_filter = ['level', 'category']
    search_fields = ['name']


@admin.register(CVLanguage)
class CVLanguageAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'order']
    list_filter = ['level']
    search_fields = ['name']


@admin.register(CVCertification)
class CVCertificationAdmin(admin.ModelAdmin):
    list_display = ['name', 'issuer', 'issue_date', 'order']
    search_fields = ['name', 'issuer']


@admin.register(CVProject)
class CVProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_ongoing', 'order']
    list_filter = ['is_ongoing']
    search_fields = ['title', 'description']


@admin.register(CVInterest)
class CVInterestAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'order']
    search_fields = ['name']
