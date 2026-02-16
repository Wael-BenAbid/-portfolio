"""
Content App - Site content and settings
"""
from django.db import models


class SiteSettings(models.Model):
    """Singleton model for site-wide settings"""
    
    # Basic Info
    site_name = models.CharField(max_length=100, default='Portfolio')
    site_title = models.CharField(max_length=100, default='ADRIAN')
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    favicon_url = models.URLField(max_length=500, blank=True, null=True)
    site_description = models.TextField(blank=True)
    
    # Hero Section
    hero_title = models.CharField(max_length=100, default='Creative Developer')
    hero_subtitle = models.CharField(max_length=200, blank=True)
    hero_tagline = models.CharField(max_length=200, blank=True)
    
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
    google_client_secret = models.CharField(max_length=200, blank=True)
    facebook_app_id = models.CharField(max_length=200, blank=True)
    facebook_app_secret = models.CharField(max_length=200, blank=True)
    
    # Email Settings
    email_host = models.CharField(max_length=100, blank=True)
    email_port = models.IntegerField(default=587)
    email_host_user = models.EmailField(blank=True)
    email_host_password = models.CharField(max_length=100, blank=True)
    default_from_email = models.EmailField(blank=True)
    
    # Contact
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    
    # Footer
    footer_text = models.TextField(blank=True)
    copyright_year = models.IntegerField(default=2024)
    version = models.CharField(max_length=20, default='1.0.0')
    
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
