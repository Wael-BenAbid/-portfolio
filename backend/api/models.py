"""
API Models - Main app containing CustomUser for backward compatibility.
Other models have been separated into microservice apps.
"""
import uuid
import os
import secrets
import hashlib
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
    
    Uses ForeignKey (not OneToOneField) to allow multiple refresh tokens per user,
    but only one active (non-revoked) token at a time via partial unique constraint.
    """
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='refresh_tokens'
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
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(revoked_at__isnull=True),
                name='unique_active_refresh_token_per_user'
            )
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
    session_key = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Unique session identifier"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of visitor (not anonymized at consent time)"
    )
    consent_given = models.BooleanField(
        default=False,
        help_text="Whether visitor consented to tracking"
    )
    consent_version = models.CharField(
        max_length=10,
        default='1.0',
        help_text="Version of privacy policy accepted"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        help_text="When consent expires (usually 90 days from creation)"
    )
    
    class Meta:
        verbose_name = 'Visitor Consent'
        verbose_name_plural = 'Visitor Consents'
        indexes = [
            models.Index(fields=['session_key']),
            models.Index(fields=['expires_at']),
        ]
    
    def is_valid(self) -> bool:
        """Check if consent is still valid."""
        return (
            self.consent_given and
            self.expires_at > timezone.now()
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
            session_key=session_key,
            defaults={
                'ip_address': ip_address,
                'consent_given': consent_given,
                'expires_at': timezone.now() + timezone.timedelta(days=90)
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

# ============================================================================
# SECURITY & LOGGING MODELS
# ============================================================================

class LoginActivity(models.Model):
    """
    Track all login attempts with IP, device, and location information.
    Used for security monitoring and detecting suspicious activity.
    """
    STATUS_CHOICES = [
        ('success', 'Successful Login'),
        ('failed', 'Failed Login'),
        ('invalid_credentials', 'Invalid Credentials'),
        ('account_locked', 'Account Locked'),
        ('mfa_required', 'MFA Required'),
    ]
    
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='login_activities',
        null=True,
        blank=True,  # Allow NULL for failed logins where user wasn't found
        help_text="User who attempted login (NULL if user not found)"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='failed')
    ip_address = models.GenericIPAddressField(help_text="Source IP address")
    user_agent = models.TextField(help_text="Full user agent string")
    
    # Parsed device information
    device_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="Device type: desktop, mobile, tablet"
    )
    browser = models.CharField(
        max_length=100,
        blank=True,
        help_text="Browser name and version"
    )
    os = models.CharField(
        max_length=100,
        blank=True,
        help_text="Operating system"
    )
    
    # Geolocation
    country = models.CharField(
        max_length=100,
        blank=True,
        help_text="Country based on IP geolocation"
    )
    city = models.CharField(
        max_length=100,
        blank=True,
        help_text="City based on IP geolocation"
    )
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Metadata for security alerts
    failed_attempt_after_success = models.BooleanField(
        default=False,
        help_text="True if this failed login came shortly after a successful one"
    )
    unusual_location = models.BooleanField(
        default=False,
        help_text="True if login is from unusual location"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Login Activity'
        verbose_name_plural = 'Login Activities'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['ip_address', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['country', '-created_at']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else "Unknown"
        return f"{self.status.upper()} - {user_str} from {self.ip_address} at {self.created_at}"


class ActivityLog(models.Model):
    """
    General activity logging for all important user actions.
    Tracks: profile updates, password changes, API modifications, etc.
    """
    ACTION_CHOICES = [
        # Auth related
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('social_login', 'Social/OAuth Login'),
        ('new_user_registration', 'New User Registration'),
        ('password_change', 'Password Changed'),
        ('password_reset', 'Password Reset'),
        ('email_change', 'Email Changed'),
        
        # Profile
        ('profile_update', 'Profile Updated'),
        ('profile_picture_upload', 'Profile Picture Uploaded'),
        
        # API/Data operations
        ('api_request', 'API Request'),
        ('data_create', 'Data Created'),
        ('data_update', 'Data Updated'),
        ('data_delete', 'Data Deleted'),
        
        # Admin
        ('user_created', 'User Created'),
        ('user_updated', 'User Updated'),
        ('user_deleted', 'User Deleted'),
        ('user_type_changed', 'User Type Changed'),
        
        # Security
        ('security_alert', 'Security Alert'),
        ('mfa_enabled', 'MFA Enabled'),
        ('mfa_disabled', 'MFA Disabled'),
        ('session_revoked', 'Session Revoked'),
    ]
    
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        help_text="User who performed the action"
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    description = models.TextField(help_text="Detailed description of the action")
    
    # Request information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # What was changed (for auditing)
    object_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="Type of object affected (User, Profile, etc)"
    )
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="ID of the affected object"
    )
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text="Dictionary of changes: {field: (old_value, new_value)}"
    )
    
    # Status
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['object_type', 'object_id']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else "System"
        return f"{self.action}: {user_str} at {self.created_at}"


class SecurityAlert(models.Model):
    """
    Automatic security alerts for suspicious activities.
    Triggers when:
    - Multiple failed login attempts
    - Login from unusual location
    - Unusual API activity
    - Massive data modifications
    """
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('false_positive', 'False Positive'),
    ]
    
    ALERT_TYPE_CHOICES = [
        ('brute_force', 'Brute Force Attack'),
        ('unusual_location', 'Login from Unusual Location'),
        ('impossible_travel', 'Impossible Travel'),
        ('mass_api_requests', 'Mass API Requests'),
        ('data_exfiltration', 'Data Exfiltration'),
        ('privilege_escalation', 'Privilege Escalation'),
        ('malware_detected', 'Malware Detected'),
        ('custom', 'Custom Alert'),
    ]
    
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='security_alerts',
        null=True,
        blank=True
    )
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    
    title = models.CharField(max_length=255, help_text="Alert title")
    description = models.TextField(help_text="Detailed description")
    
    # Evidence
    evidence = models.JSONField(
        default=dict,
        blank=True,
        help_text="Evidence data (IP addresses, IPs, counts, etc)"
    )
    
    # Action taken
    action_taken = models.TextField(blank=True, help_text="What was done (e.g., account locked)")
    notified_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Security Alert'
        verbose_name_plural = 'Security Alerts'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['severity', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_severity_display()} - {self.get_alert_type_display()} at {self.created_at}"


# ============================================================================
# PASSWORD RESET
# ============================================================================

class PasswordResetToken(models.Model):
    """Model for password reset tokens."""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Reset token for {self.user.email} - {self.created_at}"
    
    @property
    def is_valid(self):
        """Check if token is still valid (not expired and not used)."""
        from django.utils import timezone
        return not self.used and timezone.now() < self.expires_at

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Return deterministic hash for a raw reset token."""
        return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
    
    @staticmethod
    def create_for_user(user):
        """Create a new password reset token for a user."""
        import secrets
        from django.utils import timezone
        from datetime import timedelta
        
        token = secrets.token_urlsafe(32)
        token_hash = PasswordResetToken.hash_token(token)
        expires_at = timezone.now() + timedelta(hours=24)
        
        # Invalidate all previous tokens
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        
        reset_token = PasswordResetToken.objects.create(
            user=user,
            token=token_hash,
            expires_at=expires_at
        )
        # Plain token must never be persisted; keep it in-memory for email delivery.
        reset_token.plain_token = token
        return reset_token