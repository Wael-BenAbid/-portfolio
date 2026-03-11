"""
Content App - Site content and settings
"""
from django.db import models


class SiteSettings(models.Model):
    """Singleton model for site-wide settings"""
    
    # Basic Info
    site_name = models.CharField(max_length=100, default='Portfolio')
    site_title = models.CharField(max_length=100, default='WAEL')
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    favicon_url = models.URLField(max_length=500, blank=True, null=True)
    site_description = models.TextField(blank=True)
    
    # Theme Settings
    primary_color = models.CharField(max_length=7, default='#6366f1', help_text="Primary color hex code (e.g., #6366f1)")
    secondary_color = models.CharField(max_length=7, default='#8b5cf6', help_text="Secondary color hex code (e.g., #8b5cf6)")
    accent_color = models.CharField(max_length=7, default='#ec4899', help_text="Accent color hex code (e.g., #ec4899)")
    background_color = models.CharField(max_length=7, default='#0a0a0a', help_text="Background color hex code (e.g., #0a0a0a)")
    cursor_theme = models.CharField(max_length=20, default='default', help_text="Cursor theme (default, neon, minimal, custom)")
    cursor_size = models.IntegerField(default=20, help_text="Cursor size in pixels (10-50)")
    custom_cursor_color = models.CharField(max_length=7, default='#6366f1', help_text="Custom cursor color hex code (only applicable if cursor theme is custom)")
    cursor_enabled_mobile = models.BooleanField(default=False, help_text="Enable custom cursor on mobile/touch devices")
    
    # Hero Section
    hero_title = models.CharField(max_length=100, default='CREATIVE DEVELOPER')
    hero_subtitle = models.CharField(max_length=200, blank=True)
    hero_tagline = models.CharField(max_length=200, blank=True)

     # About Section
    about_title = models.CharField(max_length=100, default='THE MIND BEHIND')
    about_quote = models.TextField(default='"Technology is the vessel, but storytelling is the destination. I create digital landmarks that bridge the gap between imagination and reality."')
    profile_image = models.URLField(max_length=500, blank=True, null=True, help_text="Profile image URL for about section")
    drone_image = models.URLField(max_length=500, blank=True, null=True, help_text="Drone/work image URL for about section")
    drone_video_url = models.URLField(max_length=500, blank=True, null=True, help_text="Drone/work video URL for about section (will be used instead of image if provided)")

    # Navigation Bar
    nav_work_label = models.CharField(max_length=50, default='Work', help_text="Label for Work navigation link")
    nav_about_label = models.CharField(max_length=50, default='About', help_text="Label for About navigation link")
    nav_contact_label = models.CharField(max_length=50, default='Contact', help_text="Label for Contact navigation link")
    
    # CV Personal Info
    cv_full_name = models.CharField(max_length=100, blank=True)
    cv_job_title = models.CharField(max_length=100, blank=True)
    cv_email = models.EmailField(blank=True)
    cv_phone = models.CharField(max_length=20, blank=True)
    cv_location = models.CharField(max_length=100, blank=True)
    cv_profile_image = models.URLField(max_length=500, blank=True, null=True)
    cv_summary = models.TextField(blank=True)
    
    # Location
    location = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Social Media
    instagram_url = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    
    # OAuth Settings
    google_client_id = models.CharField(max_length=200, blank=True)
    _google_client_secret = models.CharField(max_length=300, blank=True, db_column='google_client_secret')
    facebook_app_id = models.CharField(max_length=200, blank=True)
    _facebook_app_secret = models.CharField(max_length=300, blank=True, db_column='facebook_app_secret')
    
    # Email Settings
    email_host = models.CharField(max_length=100, blank=True)
    email_port = models.IntegerField(default=587)
    email_host_user = models.EmailField(blank=True)
    _email_host_password = models.CharField(max_length=300, blank=True, db_column='email_host_password')
    default_from_email = models.EmailField(blank=True)
    
    @property
    def google_client_secret(self):
        from api.utils import decrypt
        return decrypt(self._google_client_secret)
    
    @google_client_secret.setter
    def google_client_secret(self, value):
        from api.utils import encrypt
        self._google_client_secret = encrypt(value)
    
    @property
    def facebook_app_secret(self):
        from api.utils import decrypt
        return decrypt(self._facebook_app_secret)
    
    @facebook_app_secret.setter
    def facebook_app_secret(self, value):
        from api.utils import encrypt
        self._facebook_app_secret = encrypt(value)
    
    @property
    def email_host_password(self):
        from api.utils import decrypt
        return decrypt(self._email_host_password)
    
    @email_host_password.setter
    def email_host_password(self, value):
        from api.utils import encrypt
        self._email_host_password = encrypt(value)
    
    # Contact
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_title = models.CharField(max_length=100, default='Créons Ensemble')
    contact_subtitle = models.TextField(default='Que vous ayez besoin d\'un ingénieur full-stack ou d\'un cinéaste drone, je suis prêt pour le prochain défi.')
    contact_form_placeholder_name = models.CharField(max_length=100, default='Votre Nom')
    contact_form_placeholder_email = models.CharField(max_length=100, default='nom@email.com')
    contact_form_placeholder_subject = models.CharField(max_length=100, default='Sujet')
    contact_form_placeholder_message = models.CharField(max_length=200, default='Parlez-moi de votre vision...')
    contact_form_button_text = models.CharField(max_length=50, default='Envoyer le Message')
    
     # Footer
    footer_text = models.TextField(blank=True)
    copyright_year = models.IntegerField(default=2024)
    version = models.CharField(max_length=20, default='1.0.0')
    designer_name = models.CharField(max_length=100, blank=True, default='WAEL')
    copyright_text = models.CharField(max_length=200, blank=True, default='Your Name. All rights reserved.')
    show_location = models.BooleanField(default=True)
    footer_background_video = models.URLField(max_length=500, blank=True, null=True, help_text="Footer background video URL (will be used instead of solid background if provided)")
    
    # SEO
    meta_title = models.CharField(max_length=100, blank=True)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and SiteSettings.objects.exists():
            raise ValueError('Only one SiteSettings instance is allowed')
        return super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
    
    def __str__(self):
        return self.site_name


class About(models.Model):
    """About page content"""
    title = models.CharField(max_length=100)
    content = models.TextField()
    image = models.URLField(max_length=500, blank=True, null=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = "About Section"
        verbose_name_plural = "About Sections"
    
    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    """Contact form submissions"""
    STATUS_CHOICES = [
        ('new', 'New'),
        ('read', 'Read'),
        ('replied', 'Replied'),
        ('archived', 'Archived'),
    ]
    
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    user = models.ForeignKey('api.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='contact_messages')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    admin_reply = models.TextField(blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"
    
    def __str__(self):
        return f"{self.name} - {self.subject}"


class EmailSubscription(models.Model):
    """Email newsletter subscriptions"""
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = "Email Subscription"
        verbose_name_plural = "Email Subscriptions"
    
    def __str__(self):
        return self.email
