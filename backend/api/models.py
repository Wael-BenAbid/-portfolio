"""
API Models - Main app containing CustomUser for backward compatibility.
Other models have been separated into microservice apps.
"""
import uuid
import os
from django.db import models
from django.utils.text import slugify, get_valid_filename
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone


def get_image_upload_path(instance, filename):
    """
    Generate a secure upload path for images.
    
    Security features:
    - Uses UUID prefix to prevent filename collisions and enumeration
    - Sanitizes filename to prevent path traversal attacks
    - Organizes files by date for better management
    
    Args:
        instance: The ImageUpload model instance
        filename: The original filename from the upload
        
    Returns:
        A secure path like: uploads/2025/02/28/uuid-sanitized-filename.jpg
    """
    # Sanitize the filename to prevent path traversal
    safe_filename = get_valid_filename(filename)
    
    # Generate a UUID prefix to prevent filename collisions
    uuid_prefix = str(uuid.uuid4())[:8]
    
    # Get file extension
    name, ext = os.path.splitext(safe_filename)
    
    # Create new filename with UUID prefix
    new_filename = f"{uuid_prefix}-{name}{ext}"
    
    # Organize by year/month for better file management
    from django.utils import timezone
    now = timezone.now()
    upload_path = os.path.join(
        'uploads',
        str(now.year),
        f"{now.month:02d}",
        f"{now.day:02d}"
    )
    
    return os.path.join(upload_path, new_filename)


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
    email = models.EmailField(unique=True, db_index=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='visitor')
    profile_image = models.URLField(max_length=500, blank=True, null=True, help_text="URL to profile image")
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
    
    # Security: Track if user needs to change password (for auto-created admin)
    requires_password_change = models.BooleanField(default=False)
    
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


class ImageUpload(models.Model):
    """
    Model for storing uploaded images with secure file handling.
    
    Security features:
    - Custom upload_to function with UUID prefix and filename sanitization
    - Organized by date for better management
    - Prevents path traversal and filename collisions
    """
    image = models.ImageField(upload_to=get_image_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_images'
    )

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Image Upload'
        verbose_name_plural = 'Image Uploads'

    def __str__(self):
        return f"Image {self.id} - {self.image.name}"


class Visitor(models.Model):
    """Model for tracking website visitors."""
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    referrer = models.URLField(null=True, blank=True, max_length=500)
    path = models.CharField(max_length=500, null=True, blank=True)
    session_key = models.CharField(max_length=64, null=True, blank=True)  # Django session key (up to 64 chars)
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visits'
    )
    visit_time = models.DateTimeField(default=timezone.now)
    is_unique = models.BooleanField(default=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    device_type = models.CharField(max_length=50, null=True, blank=True)
    browser = models.CharField(max_length=50, null=True, blank=True)
    os = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        ordering = ['-visit_time']
        verbose_name = 'Visitor'
        verbose_name_plural = 'Visitors'

    def __str__(self):
        return f"Visitor {self.ip_address} at {self.visit_time}"
    
    def save(self, *args, **kwargs):
        """
        Override save method.
        Note: Django session keys are already secure and hashed, so we don't
        need to hash them again. The session_key field stores the Django
        session ID directly for visitor tracking purposes.
        """
        super().save(*args, **kwargs)
