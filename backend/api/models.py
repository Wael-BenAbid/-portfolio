
from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    USER_TYPES = [
        ('admin', 'Admin'),
        ('registered', 'Registered User'),
        ('visitor', 'Visitor'),
    ]
    
    username = None  # Remove username field
    email = models.EmailField(unique=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='visitor')
    profile_image = models.ImageField(upload_to='users/profiles/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Social auth fields
    google_id = models.CharField(max_length=100, blank=True, null=True)
    facebook_id = models.CharField(max_length=100, blank=True, null=True)
    auth_provider = models.CharField(max_length=20, default='email')  # email, google, facebook
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    notify_new_projects = models.BooleanField(default=True)
    notify_updates = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = CustomUserManager()
    
    def __str__(self):
        return self.email
    
    def is_admin(self):
        return self.user_type == 'admin'
    
    def is_registered_user(self):
        return self.user_type == 'registered'


class Project(models.Model):
    CATEGORY_CHOICES = [
        ('Development', 'Development'),
        ('Drone', 'Drone'),
        ('Mixed', 'Mixed'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    thumbnail = models.ImageField(upload_to='projects/thumbnails/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    featured = models.BooleanField(default=False)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='projects')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
    
    @property
    def likes_count(self):
        return self.likes.count()


class MediaItem(models.Model):
    MEDIA_TYPE = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    project = models.ForeignKey(Project, related_name='media', on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=MEDIA_TYPE)
    image = models.ImageField(upload_to='projects/media/', null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
    
    @property
    def likes_count(self):
        return self.likes.count()


class Skill(models.Model):
    CATEGORIES = [
        ('Frontend', 'Frontend'),
        ('Backend', 'Backend'),
        ('DevOps', 'DevOps'),
        ('Drone', 'Drone'),
        ('Editing', 'Editing'),
    ]
    name = models.CharField(max_length=100)
    level = models.IntegerField()
    category = models.CharField(max_length=20, choices=CATEGORIES)

    def __str__(self):
        return self.name


class About(models.Model):
    bio = models.TextField()
    profile_image = models.ImageField(upload_to='about/')
    drone_image = models.ImageField(upload_to='about/')

    class Meta:
        verbose_name_plural = "About"


class Like(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='likes')
    content_type = models.CharField(max_length=20)  # 'project', 'media', 'photo', 'video'
    content_id = models.IntegerField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='likes', null=True, blank=True)
    media = models.ForeignKey(MediaItem, on_delete=models.CASCADE, related_name='likes', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'content_type', 'content_id']
    
    def __str__(self):
        return f"{self.user.email} likes {self.content_type}:{self.content_id}"


class ContactMessage(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('read', 'Read'),
        ('replied', 'Replied'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_reply = models.TextField(blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.subject}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('new_project', 'New Project'),
        ('project_update', 'Project Update'),
        ('new_message', 'New Message'),
        ('system', 'System Notification'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    recipients = models.ManyToManyField(CustomUser, related_name='notifications')
    is_read = models.ManyToManyField(CustomUser, related_name='read_notifications', blank=True)
    link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class EmailSubscription(models.Model):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.email


class SiteSettings(models.Model):
    """Site configuration settings - managed by admin"""
    # Branding
    site_name = models.CharField(max_length=100, default='Portfolio')
    site_title = models.CharField(max_length=100, default='ADRIAN')
    logo_url = models.URLField(blank=True, help_text="URL to your logo image")
    favicon_url = models.URLField(blank=True, help_text="URL to your favicon")
    site_description = models.TextField(blank=True)
    
    # Hero Section
    hero_title = models.CharField(max_length=100, default='ACTIVE')
    hero_subtitle = models.CharField(max_length=100, default='THEORY')
    hero_tagline = models.CharField(max_length=200, default='Digital Experiences & Aerial Visuals')
    
    # CV Section - Personal Info
    cv_full_name = models.CharField(max_length=100, blank=True, default='')
    cv_job_title = models.CharField(max_length=100, blank=True, default='')
    cv_email = models.EmailField(blank=True, default='')
    cv_phone = models.CharField(max_length=20, blank=True, default='')
    cv_location = models.CharField(max_length=100, blank=True, default='')
    cv_profile_image = models.URLField(blank=True, default='')
    cv_summary = models.TextField(blank=True, default='')
    
    # Location
    location = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=8, decimal_places=4, default=33.5731)
    longitude = models.DecimalField(max_digits=8, decimal_places=4, default=-7.5898)
    
    # Social Media Links
    instagram_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    
    # OAuth Settings
    google_client_id = models.CharField(max_length=200, blank=True)
    google_client_secret = models.CharField(max_length=200, blank=True)
    facebook_app_id = models.CharField(max_length=200, blank=True)
    facebook_app_secret = models.CharField(max_length=200, blank=True)
    
    # Email Settings
    email_host = models.CharField(max_length=100, blank=True)
    email_port = models.IntegerField(default=587)
    email_host_user = models.EmailField(blank=True)
    email_host_password = models.CharField(max_length=200, blank=True)
    default_from_email = models.EmailField(blank=True)
    
    # Contact Info
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    
    # Footer
    footer_text = models.CharField(max_length=100, default='DESIGNED BY ADRIAN')
    copyright_year = models.IntegerField(default=2024)
    version = models.CharField(max_length=20, default='1.0')
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.TextField(blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"
    
    def __str__(self):
        return "Site Settings"
    
    @classmethod
    def get_settings(cls):
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings


# ============ CV Models ============

class CVExperience(models.Model):
    """Work Experience entries for CV"""
    title = models.CharField(max_length=100)
    company = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-order', '-start_date']
        verbose_name = "CV Experience"
        verbose_name_plural = "CV Experiences"
    
    def __str__(self):
        return f"{self.title} at {self.company}"


class CVEducation(models.Model):
    """Education entries for CV"""
    degree = models.CharField(max_length=100)
    institution = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    gpa = models.CharField(max_length=10, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-order', '-start_date']
        verbose_name = "CV Education"
        verbose_name_plural = "CV Education"
    
    def __str__(self):
        return f"{self.degree} at {self.institution}"


class CVSkill(models.Model):
    """Skills for CV"""
    SKILL_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    SKILL_CATEGORIES = [
        ('technical', 'Technical'),
        ('language', 'Language'),
        ('soft', 'Soft Skills'),
        ('tool', 'Tools & Software'),
        ('other', 'Other'),
    ]
    name = models.CharField(max_length=50)
    level = models.CharField(max_length=20, choices=SKILL_LEVELS, default='intermediate')
    category = models.CharField(max_length=20, choices=SKILL_CATEGORIES, default='technical')
    percentage = models.IntegerField(default=80, help_text="Skill percentage (0-100)")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', '-percentage', 'order']
        verbose_name = "CV Skill"
        verbose_name_plural = "CV Skills"
    
    def __str__(self):
        return f"{self.name} ({self.level})"


class CVLanguage(models.Model):
    """Languages for CV"""
    LANGUAGE_LEVELS = [
        ('native', 'Native'),
        ('fluent', 'Fluent'),
        ('advanced', 'Advanced'),
        ('intermediate', 'Intermediate'),
        ('basic', 'Basic'),
    ]
    name = models.CharField(max_length=50)
    level = models.CharField(max_length=20, choices=LANGUAGE_LEVELS, default='intermediate')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = "CV Language"
        verbose_name_plural = "CV Languages"
    
    def __str__(self):
        return f"{self.name} ({self.level})"


class CVCertification(models.Model):
    """Certifications for CV"""
    name = models.CharField(max_length=100)
    issuer = models.CharField(max_length=100)
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    credential_id = models.CharField(max_length=100, blank=True)
    credential_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-order', '-issue_date']
        verbose_name = "CV Certification"
        verbose_name_plural = "CV Certifications"
    
    def __str__(self):
        return f"{self.name} - {self.issuer}"


class CVProject(models.Model):
    """Projects for CV"""
    title = models.CharField(max_length=100)
    description = models.TextField()
    technologies = models.CharField(max_length=200, blank=True, help_text="Comma-separated list of technologies")
    url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_ongoing = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-order', '-start_date']
        verbose_name = "CV Project"
        verbose_name_plural = "CV Projects"
    
    def __str__(self):
        return self.title


class CVInterest(models.Model):
    """Interests/Hobbies for CV"""
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name or emoji")
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = "CV Interest"
        verbose_name_plural = "CV Interests"
    
    def __str__(self):
        return self.name
