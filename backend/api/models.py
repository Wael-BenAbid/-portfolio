"""
API Models - Main app containing CustomUser for backward compatibility.
Other models have been separated into microservice apps.
"""
import uuid
import os
import secrets
from django.db import models
from django.utils.text import slugify, get_valid_filename
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from datetime import timedelta


def get_media_upload_path(instance, filename):
    """
    Generate a secure upload path for media files (images and videos).
    
    Security features:
    - Uses UUID prefix to prevent filename collisions and enumeration
    - Sanitizes filename to prevent path traversal attacks
    - Organizes files by date for better management
    
    Args:
        instance: The MediaUpload model instance
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


class OAuthState(models.Model):
    """
    OAuth state tokens for CSRF protection during OAuth flow.
    
    Security:
    - State parameter prevents CSRF attacks on OAuth endpoints
    - Each redirect includes unique state that must match in callback
    - Expires after 15 minutes of creation
    - One-time use (deleted after successful verification)
    
    OAuth Flow:
    1. Frontend requests new state: GET /api/auth/oauth-state/
    2. Backend creates OAuthState, returns state + nonce
    3. Frontend redirects to provider with state parameter
    4. Provider redirects back to /callback?state=xxx&code=yyy
    5. Backend verifies state matches, exchanges for token
    6. Deletes used state (prevents replay attacks)
    """
    state = models.CharField(
        max_length=128,
        unique=True,
        db_index=True,
        help_text="CSRF token for OAuth flow"
    )
    nonce = models.CharField(
        max_length=128,
        unique=True,
        help_text="Nonce for ID token validation (OpenID Connect)"
    )
    provider = models.CharField(
        max_length=50,
        choices=[
            ('github', 'GitHub'),
            ('google', 'Google'),
            ('microsoft', 'Microsoft'),
        ],
        help_text="OAuth provider identifier"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        help_text="When this state token expires (15 min)"
    )
    
    @staticmethod
    def create_for_provider(provider):
        """Create new state + nonce pair for OAuth flow"""
        state = secrets.token_urlsafe(96)  # 128-char URL-safe token
        nonce = secrets.token_urlsafe(96)  # For ID token validation
        expires_at = timezone.now() + timedelta(minutes=15)
        
        oauth_state = OAuthState.objects.create(
            state=state,
            nonce=nonce,
            provider=provider,
            expires_at=expires_at
        )
        return oauth_state
    
    @staticmethod
    def verify_and_consume(state, provider):
        """
        Verify state is valid and consume it (one-time use).
        
        Returns: OAuthState if valid, None if invalid/expired/used
        """
        try:
            oauth_state = OAuthState.objects.get(
                state=state,
                provider=provider,
                expires_at__gt=timezone.now()
            )
            # Consume (delete) to prevent replay attacks
            oauth_state.delete()
            return oauth_state
        except OAuthState.DoesNotExist:
            return None
    
    class Meta:
        indexes = [
            models.Index(fields=['state', 'provider']),
            models.Index(fields=['expires_at']),
        ]


class RefreshToken(models.Model):
    """
    Refresh tokens for token rotation strategy.
    
    Security Strategy:
    - Access token: 2 hours (short-lived, in memory)
    - Refresh token: 7 days (long-lived, in secure httpOnly cookie)
    
    When access token expires, client uses refresh token to get a new one.
    The refresh token is only sent to /api/auth/refresh/ endpoint (path-restricted).
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='refresh_token'
    )
    token = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Secret refresh token value"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        help_text="When this refresh token expires"
    )
    revoked_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this token was revoked (null = still valid)"
    )
    
    class Meta:
        verbose_name = 'Refresh Token'
        verbose_name_plural = 'Refresh Tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['user']),
        ]
    
    def is_valid(self) -> bool:
        """
        Check if token is valid (not expired, not revoked).
        
        Returns:
            bool: True if token is still valid
        """
        now = timezone.now()
        return (
            self.expires_at > now and
            self.revoked_at is None
        )
    
    @classmethod
    def create_for_user(cls, user: 'CustomUser') -> 'RefreshToken':
        """
        Create a new refresh token for a user, revoking any previous tokens.
        
        Args:
            user: The user to create a token for
            
        Returns:
            RefreshToken: The newly created refresh token
        """
        import secrets
        from datetime import timedelta
        
        # Revoke any existing tokens for this user
        cls.objects.filter(user=user).update(
            revoked_at=timezone.now()
        )
        
        # Create new refresh token (32 bytes = 256 bits of entropy)
        token_value = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(days=7)
        
        return cls.objects.create(
            user=user,
            token=token_value,
            expires_at=expires_at
        )
    
    def revoke(self) -> None:
        """Revoke this token (for logout)."""
        self.revoked_at = timezone.now()
        self.save(update_fields=['revoked_at'])


class MediaUpload(models.Model):
    """
    Model for storing uploaded media files (images and videos) with secure file handling.
    
    Security features:
    - Custom upload_to function with UUID prefix and filename sanitization
    - Organized by date for better management
    - Prevents path traversal and filename collisions
    """
    file = models.FileField(upload_to=get_media_upload_path)
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
        return f"Media {self.id} - {self.file.name}"


class VisitorConsent(models.Model):
    """
    GDPR: Track visitor consent for analytics tracking.
    
    Strategy:
    - Visitors can opt-in to be tracked
    - Consent stored for 90 days then auto-deleted
    - Only track IP (anonymized), user agent if consent given
    - All visitor records reference the consent record
    """
    SESSION_KEY = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Unique session identifier"
    )
    IP_ADDRESS = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of visitor (not anonymized at consent time)"
    )
    CONSENT_GIVEN = models.BooleanField(
        default=False,
        help_text="Whether visitor consented to tracking"
    )
    CONSENT_VERSION = models.CharField(
        max_length=10,
        default='1.0',
        help_text="Version of privacy policy accepted"
    )
    CREATED_AT = models.DateTimeField(auto_now_add=True)
    EXPIRES_AT = models.DateTimeField(
        help_text="When consent expires (usually 90 days from creation)"
    )
    
    class Meta:
        verbose_name = 'Visitor Consent'
        verbose_name_plural = 'Visitor Consents'
        indexes = [
            models.Index(fields=['SESSION_KEY']),
            models.Index(fields=['EXPIRES_AT']),
        ]
    
    def is_valid(self) -> bool:
        """Check if consent is still valid."""
        return (
            self.CONSENT_GIVEN and
            self.EXPIRES_AT > timezone.now()
        )
    
    @classmethod
    def get_or_create_consent(cls, session_key: str, ip_address: str = None, consent_given: bool = False) -> 'VisitorConsent':
        """
        Get existing consent or create new one.
        
        Args:
            session_key: Django session key
            ip_address: Visitor IP address
            consent_given: Whether user consented
            
        Returns:
            VisitorConsent: The consent record
        """
        consent, created = cls.objects.get_or_create(
            SESSION_KEY=session_key,
            defaults={
                'IP_ADDRESS': ip_address,
                'CONSENT_GIVEN': consent_given,
                'EXPIRES_AT': timezone.now() + timezone.timedelta(days=90)
            }
        )
        return consent


class Visitor(models.Model):
    """
    GDPR-compliant visitor tracking model.
    
    Privacy features:
    - IP addresses anonymized (last octet = 0)
    - Only stores if user gave consent
    - Auto-deletes after 90 days (implement via management command)
    - Includes consent record reference for audit trail
    """
    anonymized_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        db_index=True,
        help_text="IP with last octet anonymized (e.g., 192.168.1.0)"
    )
    user_agent = models.TextField(
        null=True,
        blank=True,
        help_text="Browser user agent string"
    )
    referrer = models.URLField(
        null=True,
        blank=True,
        max_length=500,
        help_text="HTTP referrer"
    )
    path = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        db_index=True,
        help_text="Request path"
    )
    session_key = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        db_index=True,
        help_text="Django session key for this visitor"
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visits'
    )
    visit_time = models.DateTimeField(
        default=timezone.now,
        db_index=True
    )
    is_unique = models.BooleanField(
        default=True,
        help_text="Whether this is a unique visitor"
    )
    country = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )
    city = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )
    device_type = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )
    browser = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )
    os = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )
    # GDPR fields
    consent_record = models.ForeignKey(
        VisitorConsent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Reference to consent record at time of visit"
    )
    will_delete_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When this record will auto-delete (90 days after creation)"
    )

    class Meta:
        ordering = ['-visit_time']
        verbose_name = 'Visitor'
        verbose_name_plural = 'Visitors'
        indexes = [
            models.Index(fields=['-visit_time']),
            models.Index(fields=['session_key']),
            models.Index(fields=['will_delete_at']),
        ]

    def __str__(self):
        return f"Visitor {self.anonymized_ip} at {self.visit_time}"
    
    def save(self, *args, **kwargs):
        """Set auto-delete time (90 days from now)."""
        if not self.will_delete_at:
            self.will_delete_at = timezone.now() + timezone.timedelta(days=90)
        super().save(*args, **kwargs)
