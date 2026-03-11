"""
Content App - Serializers for site content
"""
from rest_framework import serializers
from .models import SiteSettings, About, ContactMessage, EmailSubscription


class SiteSettingsSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    google_client_secret = serializers.CharField(write_only=True, required=False, allow_blank=True)
    facebook_app_secret = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email_host_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = SiteSettings
        fields = [
            'site_name', 'site_title', 'logo_url', 'favicon_url', 'site_description',
            'primary_color', 'secondary_color', 'accent_color', 'background_color',
            'cursor_theme', 'cursor_size', 'custom_cursor_color', 'cursor_enabled_mobile',
            'hero_title', 'hero_subtitle', 'hero_tagline',
            'about_title', 'about_quote', 'profile_image', 'drone_image', 'drone_video_url',
            'nav_work_label', 'nav_about_label', 'nav_contact_label',
            'cv_full_name', 'cv_job_title', 'cv_email', 'cv_phone', 'cv_location', 'cv_profile_image', 'cv_summary',
            'location', 'latitude', 'longitude',
            'instagram_url', 'linkedin_url', 'github_url', 'twitter_url',
            'contact_email', 'contact_phone', 'contact_title', 'contact_subtitle',
            'contact_form_placeholder_name', 'contact_form_placeholder_email',
            'contact_form_placeholder_subject', 'contact_form_placeholder_message',
            'contact_form_button_text',
            'footer_text', 'copyright_year', 'version', 'designer_name', 'copyright_text', 'show_location', 'footer_background_video',
            'meta_title', 'meta_description', 'meta_keywords',
            'google_client_id', 'google_client_secret',
            'facebook_app_id', 'facebook_app_secret',
            'email_host', 'email_port', 'email_host_user', 'email_host_password', 'default_from_email'
        ]


class SiteSettingsPublicSerializer(serializers.ModelSerializer):
    """
    Public serializer for site settings.
    Excludes sensitive OAuth and SMTP credentials from anonymous responses.
    """
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

    class Meta:
        model = SiteSettings
        fields = [
            'site_name', 'site_title', 'logo_url', 'favicon_url', 'site_description',
            'primary_color', 'secondary_color', 'accent_color', 'background_color',
            'cursor_theme', 'cursor_size', 'custom_cursor_color', 'cursor_enabled_mobile',
            'hero_title', 'hero_subtitle', 'hero_tagline',
            'about_title', 'about_quote', 'profile_image', 'drone_image', 'drone_video_url',
            'nav_work_label', 'nav_about_label', 'nav_contact_label',
            'cv_full_name', 'cv_job_title', 'cv_email', 'cv_phone', 'cv_location', 'cv_profile_image', 'cv_summary',
            'location', 'latitude', 'longitude',
            'instagram_url', 'linkedin_url', 'github_url', 'twitter_url',
            'contact_email', 'contact_phone', 'contact_title', 'contact_subtitle',
            'contact_form_placeholder_name', 'contact_form_placeholder_email',
            'contact_form_placeholder_subject', 'contact_form_placeholder_message',
            'contact_form_button_text',
            'footer_text', 'copyright_year', 'version', 'designer_name', 'copyright_text', 'show_location', 'footer_background_video',
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
        read_only_fields = ['status', 'admin_reply', 'replied_at', 'created_at', 'user']


class EmailSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailSubscription
        fields = '__all__'


class SubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class UnsubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
