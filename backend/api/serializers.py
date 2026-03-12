"""
API Serializers - Authentication and User Management
"""
import logging
import os
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.text import get_valid_filename
from .models import MediaUpload, Visitor

logger = logging.getLogger(__name__)
User = get_user_model()

# Allowed image MIME types for upload validation
ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
]

# Allowed video MIME types for upload validation
ALLOWED_VIDEO_MIME_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
]

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg']

# Combined allowed types
ALLOWED_MIME_TYPES = ALLOWED_IMAGE_MIME_TYPES + ALLOWED_VIDEO_MIME_TYPES
ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS + ALLOWED_VIDEO_EXTENSIONS


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'user_type', 'profile_image', 'bio', 'phone', 
                  'email_notifications', 'notify_new_projects', 'notify_updates',
                  'created_at', 'first_name', 'last_name', 'requires_password_change']
        read_only_fields = ['id', 'user_type', 'created_at', 'requires_password_change']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            user_type='registered',
        )
        return user


class SocialAuthSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    provider = serializers.CharField()  # google, facebook
    provider_id = serializers.CharField(required=False)
    provider_token = serializers.CharField(write_only=True, required=True)  # OAuth access token for verification (REQUIRED)
    first_name = serializers.CharField(required=False, default='')
    last_name = serializers.CharField(required=False, default='')
    profile_image = serializers.URLField(required=False, allow_null=True)

    def validate_provider(self, value):
        """Validate that the provider is supported"""
        if value not in ['google', 'github', 'microsoft']:
            raise serializers.ValidationError(f"Unsupported provider: {value}")
        return value

    def validate(self, attrs):
        """Verify the OAuth token with the provider"""
        provider = attrs.get('provider')
        provider_token = attrs.get('provider_token')
        
        # provider_token is REQUIRED for security - no bypass allowed
        if not provider_token:
            logger.warning(f"OAuth login attempted without provider_token for provider: {provider}")
            raise serializers.ValidationError("provider_token is required for OAuth authentication.")
        
        # Verify token and extract user information
        verified, user_info = self._verify_oauth_token(
            provider, 
            provider_token, 
            attrs.get('provider_id'), 
            attrs.get('email')
        )
        if not verified:
            raise serializers.ValidationError("OAuth token verification failed. Invalid or expired token.")
        
        # Add extracted user information to validated data
        if user_info:
            if 'provider_id' in user_info:
                attrs['provider_id'] = user_info['provider_id']
            if 'email' in user_info and not attrs.get('email'):
                attrs['email'] = user_info['email']
            if 'first_name' in user_info and not attrs.get('first_name'):
                attrs['first_name'] = user_info['first_name'] or ''
            if 'last_name' in user_info and not attrs.get('last_name'):
                attrs['last_name'] = user_info['last_name'] or ''
            if 'profile_image' in user_info and not attrs.get('profile_image'):
                attrs['profile_image'] = user_info['profile_image']
        
        return attrs

    def _verify_oauth_token(self, provider, token, expected_id, expected_email):
        """
        Verify OAuth token with the provider.
        Returns (True, user_info) if verified, (False, None) otherwise.
        
        Uses safe URL parameter passing to prevent injection issues.
        - Google: https://oauth2.googleapis.com/tokeninfo
        - Facebook: https://graph.facebook.com/debug_token
        """
        import requests
        from django.conf import settings
        from api.security import OAuthSecurityManager, AuditLogger
        
        try:
            if provider == 'google':
                # SECURITY: Client ID is REQUIRED - fail closed if not configured
                client_id = OAuthSecurityManager.get_oauth_client_id('google')
                if not client_id:
                    AuditLogger.log_security_event(
                        'oauth_verification_failed',
                        'high',
                        {'provider': 'google', 'reason': 'client_id_not_configured'}
                    )
                    return False, None
                
                clean_client_id = client_id.strip()
                
                # Try ID token verification first (from GoogleLogin component)
                response = requests.get(
                    'https://oauth2.googleapis.com/tokeninfo',
                    params={'id_token': token},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    token_aud = data.get('aud', '')
                    if token_aud != clean_client_id:
                        logger.warning(f"Google token audience mismatch: token_aud={repr(token_aud)} client_id={repr(clean_client_id)}")
                        return False, None
                    if expected_id and data.get('sub') != expected_id:
                        logger.warning("Google token user ID mismatch")
                        return False, None
                    if expected_email and data.get('email') != expected_email:
                        logger.warning("Google token email mismatch")
                        return False, None
                    user_info = {
                        'provider_id': data.get('sub'),
                        'email': data.get('email'),
                        'first_name': data.get('given_name'),
                        'last_name': data.get('family_name'),
                        'profile_image': data.get('picture')
                    }
                    return True, user_info
                
                # Fallback: try as access_token via userinfo endpoint (from useGoogleLogin)
                userinfo_response = requests.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    headers={'Authorization': f'Bearer {token}'},
                    timeout=5
                )
                if userinfo_response.status_code == 200:
                    data = userinfo_response.json()
                    if expected_id and data.get('sub') != expected_id:
                        logger.warning("Google access_token user ID mismatch")
                        return False, None
                    if expected_email and data.get('email') != expected_email:
                        logger.warning("Google access_token email mismatch")
                        return False, None
                    user_info = {
                        'provider_id': data.get('sub'),
                        'email': data.get('email'),
                        'first_name': data.get('given_name'),
                        'last_name': data.get('family_name'),
                        'profile_image': data.get('picture')
                    }
                    return True, user_info
                
                logger.warning(f"Google token verification failed (both id_token and access_token)")
                return False, None
                    
            elif provider == 'facebook':
                # Verify Facebook access token
                app_id = getattr(settings, 'FACEBOOK_APP_ID', None)
                app_secret = getattr(settings, 'FACEBOOK_APP_SECRET', None)
                
                if not app_id or not app_secret:
                    logger.error("Facebook app credentials not configured - OAuth verification FAILED")
                    # Always fail closed - never bypass OAuth verification
                    return False, None
                
                # Build app access token safely to prevent logging of secrets
                # Facebook requires app access token in format: app_id|app_secret
                app_access_token = f"{app_id}|{app_secret}"
                
                # Use params for safe URL encoding
                response = requests.get(
                    'https://graph.facebook.com/debug_token',
                    params={
                        'input_token': token,
                        'access_token': app_access_token
                    },
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json().get('data', {})
                    if data.get('is_valid', False):
                        # Verify the user ID matches
                        if expected_id and str(data.get('user_id')) != str(expected_id):
                            logger.warning("Facebook token user ID mismatch")
                            return False, None
                        # For Facebook, we need to get the user's email from the graph API
                        # using the access token
                        user_response = requests.get(
                            'https://graph.facebook.com/me',
                            params={
                                'fields': 'email,name,first_name,last_name,picture',
                                'access_token': token
                            },
                            timeout=5
                        )
                        if user_response.status_code == 200:
                            user_data = user_response.json()
                            if expected_email and user_data.get('email') != expected_email:
                                logger.warning("Facebook token email mismatch")
                                return False, None
                            # Extract user information from Facebook API
                            user_info = {
                                'provider_id': str(data.get('user_id')),
                                'email': user_data.get('email'),
                                'first_name': user_data.get('first_name'),
                                'last_name': user_data.get('last_name'),
                                'profile_image': user_data.get('picture', {}).get('data', {}).get('url')
                            }
                            return True, user_info
                        else:
                            logger.warning(f"Facebook email verification failed: {user_response.status_code}")
                            return False, None
                logger.warning(f"Facebook token verification failed: {response.status_code}")
                return False, None
                
        except requests.RequestException as e:
            logger.error(f"OAuth verification request failed: {e}")
            # Security: Always fail closed on network errors - never bypass OAuth verification
            return False, None
        
        return False, None

    def create_or_get_user(self, validated_data):
        provider = validated_data['provider']
        provider_id = validated_data.get('provider_id')
        email = validated_data.get('email')

        if not email:
            raise serializers.ValidationError('Email is required for OAuth authentication.')
        
        # Try to find existing user
        user = User.objects.filter(email=email).first()
        
        profile_image = validated_data.get('profile_image') or None

        if user:
            # Update social auth info — never overwrite user_type or permissions
            update_fields = ['auth_provider']
            if provider == 'google':
                user.google_id = provider_id
                update_fields.append('google_id')
            elif provider == 'facebook':
                user.facebook_id = provider_id
                update_fields.append('facebook_id')
            user.auth_provider = provider
            # Update profile image if not already set
            if profile_image and not user.profile_image:
                user.profile_image = profile_image
                update_fields.append('profile_image')
            user.save(update_fields=update_fields)
            return user, False
        
        # Create new user
        user = User.objects.create_user(
            email=email,
            first_name=validated_data.get('first_name') or '',
            last_name=validated_data.get('last_name') or '',
            user_type='registered',
            auth_provider=provider,
        )
        
        if provider == 'google':
            user.google_id = provider_id
        elif provider == 'facebook':
            user.facebook_id = provider_id
        if profile_image:
            user.profile_image = profile_image
        user.save()
        return user, True


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin to update user details including password"""
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'user_type', 
                  'profile_image', 'bio', 'phone', 'new_password']
        read_only_fields = ['id']
        extra_kwargs = {
            'profile_image': {'required': False, 'allow_blank': True, 'allow_null': True},
            'bio': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }
    
    def validate_email(self, value):
        user = self.instance
        if user and User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_new_password(self, value):
        if value and value.strip():
            validate_password(value)
        return value
    
    def update(self, instance, validated_data):
        password = validated_data.pop('new_password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password and password.strip():
            instance.set_password(password)
        
        instance.save()
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        
        # Always require current password for security
        # This prevents session hijacking attacks where an attacker could
        # change the password without knowing the original
        if not value:
            raise serializers.ValidationError("Current password is required.")
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        
        # Require explicit password confirmation - no default bypass
        if not confirm_password:
            raise serializers.ValidationError({'confirm_password': 'Password confirmation is required.'})
        
        if new_password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        
        # Additional security: ensure new password is different from current
        user = self.context['request'].user
        current_password = attrs.get('current_password')
        if current_password and user.check_password(new_password):
            raise serializers.ValidationError({'new_password': 'New password must be different from current password.'})

        return attrs


class MediaUploadSerializer(serializers.ModelSerializer):
    """Serializer for media uploads (images and videos)."""
    url = serializers.SerializerMethodField()

    class Meta:
        model = MediaUpload
        fields = ['id', 'file', 'url', 'uploaded_at', 'uploaded_by']
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']

    def _detect_mime_type_from_bytes(self, file_bytes: bytes, filename: str) -> str:
        """
        Detect MIME type from file magic bytes instead of just extension.
        Prevents fake file extensions (e.g., .exe renamed to .jpg).
        
        Returns:
            str: Detected MIME type
        """
        # JPEG: FF D8 FF
        if file_bytes.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg'
        
        # PNG: 89 50 4E 47
        if file_bytes.startswith(b'\x89PNG'):
            return 'image/png'
        
        # GIF: 47 49 46 38
        if file_bytes.startswith(b'GIF8'):
            return 'image/gif'
        
        # WebP: RIFF...WEBP
        if b'WEBP' in file_bytes[:32]:
            return 'image/webp'
        
        # MP4: (usually has 'ftyp' atom)
        if b'ftyp' in file_bytes[:32]:
            return 'video/mp4'
        
        # WebM: 1A 45 DF A3
        if file_bytes.startswith(b'\x1a\x45\xdf\xa3'):
            return 'video/webm'
        
        # OGG: OggS
        if file_bytes.startswith(b'OggS'):
            return 'video/ogg'
        
        # Fallback - still validate extension
        import mimetypes
        guessed, _ = mimetypes.guess_type(filename)
        return guessed or 'application/octet-stream'

    def validate_file(self, value):
        """
        Validate media file with comprehensive security checks:
        1. MIME type validation (from magic bytes, not extension)
        2. File size limit (20MB images, 100MB videos — Cloudinary handles actual storage)
        3. File extension validation
        4. Content validation using Pillow (for images)
        
        Raises:
            serializers.ValidationError: If file fails validation
        """
        # 1. Detect MIME type first — size limit depends on file type
        # 2. Detect MIME type from file content (magic bytes)
        # This prevents fake extensions like malware.exe renamed to image.jpg
        value.seek(0)
        file_header = value.read(512)  # Read first 512 bytes
        value.seek(0)  # Reset pointer
        
        detected_mime = self._detect_mime_type_from_bytes(file_header, value.name)
        
        # Get client-provided MIME type (for logging)
        client_mime = getattr(value, 'content_type', 'unknown')
        
        # Check if detected MIME type is allowed
        if detected_mime not in ALLOWED_MIME_TYPES:
            logger.warning(
                f"Rejected file '{value.name}': "
                f"detected={detected_mime}, client_claimed={client_mime}"
            )
            raise serializers.ValidationError(
                f"File type '{detected_mime}' is not allowed. "
                f"Allowed types: Images (JPEG, PNG, WebP, GIF) and Videos (MP4, WebM, OGG)"
            )
        
        # 2. Validate file size based on detected type (Cloudinary handles actual storage)
        if detected_mime in ALLOWED_VIDEO_MIME_TYPES:
            max_size_mb = int(os.environ.get('MAX_VIDEO_SIZE_MB', 100))
        else:
            max_size_mb = int(os.environ.get('MAX_IMAGE_SIZE_MB', 20))
        
        max_size = max_size_mb * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size cannot exceed {max_size_mb}MB. "
                f"Current size: {value.size / (1024 * 1024):.2f}MB"
            )
        
        # 3. Validate file extension matches detected MIME type
        filename = get_valid_filename(value.name)
        file_ext = os.path.splitext(filename)[1].lower()
        
        if not file_ext:
            raise serializers.ValidationError(
                "File must have a valid extension (e.g., .jpg, .png, .mp4)"
            )
        
        if file_ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"File extension '{file_ext}' is not allowed. "
                f"Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # 4. Validate content based on detected media type
        if detected_mime in ALLOWED_IMAGE_MIME_TYPES:
            # Validate image content using Pillow
            try:
                from PIL import Image
                
                value.seek(0)
                img = Image.open(value)
                img.verify()  # Verify it's actually an image
                
                # Re-open for further checks (verify() consumes the stream)
                value.seek(0)
                img = Image.open(value)
                
                # Check image dimensions (prevent extremely large images causing memory issues)
                max_dimension = 10000  # 10,000 pixels
                width = img.width
                height = img.height
                if width > max_dimension or height > max_dimension:
                    raise serializers.ValidationError(
                        f"Image dimensions too large: {width}x{height}. "
                        f"Maximum allowed: {max_dimension}x{max_dimension} pixels"
                    )
                
            except ImportError:
                logger.warning("Pillow not installed - skipping detailed image validation")
            except serializers.ValidationError:
                raise
            except Exception as e:
                logger.error(f"Image validation failed: {str(e)}")
                raise serializers.ValidationError(
                    "Invalid image file. The file may be corrupted or not a valid image."
                )
        elif detected_mime in ALLOWED_VIDEO_MIME_TYPES:
            # Video validation - basic checks only
            pass
        
        # Reset file pointer so storage backend (Cloudinary) reads from the start
        value.seek(0)
        return value

    def get_url(self, obj):
        """Get the full URL of the uploaded media file."""
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None


class VisitorSerializer(serializers.ModelSerializer):
    """Serializer for visitor tracking data."""
    # Keep `ip_address` in API responses for backward compatibility,
    # but source it from GDPR-safe anonymized_ip.
    ip_address = serializers.CharField(source='anonymized_ip', read_only=True)

    class Meta:
        model = Visitor
        fields = [
            'id', 'ip_address', 'user_agent', 'referrer', 'path', 
            'session_key', 'user', 'visit_time', 'is_unique', 
            'country', 'city', 'device_type', 'browser', 'os'
        ]
        read_only_fields = fields


class VisitorStatsSerializer(serializers.Serializer):
    """Serializer for visitor statistics."""
    total_visitors = serializers.IntegerField()
    unique_visitors = serializers.IntegerField()
    page_views = serializers.IntegerField()
    bounce_rate = serializers.FloatField()
    average_session_duration = serializers.FloatField()
    popular_pages = serializers.ListField()
    device_distribution = serializers.DictField()
    browser_distribution = serializers.DictField()
    os_distribution = serializers.DictField()
    daily_trend = serializers.ListField()


# ============================================================================
# SECURITY & LOGGING SERIALIZERS
# ============================================================================

class LoginActivitySerializer(serializers.ModelSerializer):
    """Serializer for LoginActivity model."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        from .models import LoginActivity
        model = LoginActivity
        fields = [
            'id', 'user', 'user_email', 'status', 'status_display', 'ip_address',
            'user_agent', 'device_type', 'browser', 'os', 'country', 'city',
            'latitude', 'longitude', 'unusual_location', 'failed_attempt_after_success',
            'created_at'
        ]
        read_only_fields = fields


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for ActivityLog model."""
    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        from .models import ActivityLog
        model = ActivityLog
        fields = [
            'id', 'user', 'user_email', 'action', 'action_display', 'description',
            'object_type', 'object_id', 'ip_address', 'user_agent', 'changes',
            'success', 'error_message', 'created_at'
        ]
        read_only_fields = fields


class SecurityAlertSerializer(serializers.ModelSerializer):
    """Serializer for SecurityAlert model."""
    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    resolved_by_email = serializers.CharField(source='resolved_by.email', read_only=True, allow_null=True)
    
    class Meta:
        from .models import SecurityAlert
        model = SecurityAlert
        fields = [
            'id', 'user', 'user_email', 'alert_type', 'alert_type_display',
            'severity', 'severity_display', 'status', 'status_display', 'title',
            'description', 'evidence', 'action_taken', 'notified_at', 'resolved_at',
            'resolved_by', 'resolved_by_email', 'created_at', 'updated_at'
        ]
        read_only_fields = fields
