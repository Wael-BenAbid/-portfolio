"""
Content App - Serializers for site content
"""
from rest_framework import serializers
from .models import SiteSettings, About, ContactMessage, EmailSubscription


class SiteSettingsSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    
    class Meta:
        model = SiteSettings
        fields = [
            'site_name', 'site_title', 'logo_url', 'favicon_url', 'site_description',
            'primary_color', 'secondary_color', 'accent_color', 'background_color',
            'cursor_theme', 'cursor_size', 'custom_cursor_color',
            'hero_title', 'hero_subtitle', 'hero_tagline',
            'about_title', 'about_quote', 'profile_image', 'drone_image',
            'nav_work_label', 'nav_about_label', 'nav_contact_label',
            'cv_full_name', 'cv_job_title', 'cv_email', 'cv_phone', 'cv_location', 'cv_profile_image', 'cv_summary',
            'location', 'latitude', 'longitude',
            'instagram_url', 'linkedin_url', 'github_url', 'twitter_url',
            'email_host', 'email_port', 'email_host_user', 'default_from_email',
            'contact_email', 'contact_phone',
            'footer_text', 'copyright_year', 'version', 'designer_name', 'copyright_text', 'show_location',
            'meta_title', 'meta_description', 'meta_keywords'
        ]


class AboutSerializer(serializers.ModelSerializer):
    class Meta:
        model = About
        fields = '__all__'


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ['status', 'admin_reply', 'replied_at', 'created_at']


class EmailSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailSubscription
        fields = '__all__'
