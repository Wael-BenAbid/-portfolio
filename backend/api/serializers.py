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
    email = serializers.EmailField()
    provider = serializers.CharField()  # google, facebook
    provider_id = serializers.CharField()
    provider_token = serializers.CharField(write_only=True, required=True)  # OAuth access token for verification (REQUIRED)
    first_name = serializers.CharField(required=False, default='')
    last_name = serializers.CharField(required=False, default='')
    profile_image = serializers.URLField(required=False, allow_null=True)

    def validate_provider(self, value):
        """Validate that the provider is supported"""
        if value not in ['google', 'facebook']:
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
        
        verified = self._verify_oauth_token(
            provider, 
            provider_token, 
            attrs.get('provider_id'), 
            attrs.get('email')
        )
        if not verified:
            raise serializers.ValidationError("OAuth token verification failed. Invalid or expired token.")
        
        return attrs

    def _verify_oauth_token(self, provider, token, expected_id, expected_email):
        """
        Verify OAuth token with the provider.
        Returns True if verified, False otherwise.
        
        Uses safe URL parameter passing to prevent injection issues.
        - Google: https://oauth2.googleapis.com/tokeninfo
        - Facebook: https://graph.facebook.com/debug_token
        """
        import requests
        from django.conf import settings
        from urllib.parse import quote
        
        try:
            if provider == 'google':
                # Verify Google ID token
                # SECURITY: Client ID is REQUIRED - fail closed if not configured
                client_id = getattr(settings, 'GOOGLE_OAUTH2_CLIENT_ID', None)
                if not client_id:
                    logger.error("GOOGLE_OAUTH2_CLIENT_ID not configured - OAuth verification FAILED")
                    return False
                
                # Use params for safe URL encoding instead of f-string interpolation
                response = requests.get(
                    'https://oauth2.googleapis.com/tokeninfo',
                    params={'id_token': token},
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    # Verify the token's audience matches our client ID
                    if data.get('aud') != client_id:
                        logger.warning("Google token audience mismatch")
                        return False
                    # Verify the user ID matches
                    if expected_id and data.get('sub') != expected_id:
                        logger.warning("Google token user ID mismatch")
                        return False
                    # Verify the email matches
                    if expected_email and data.get('email') != expected_email:
                        logger.warning("Google token email mismatch")
                        return False
                    return True
                else:
                    logger.warning(f"Google token verification failed: {response.status_code}")
                    return False
                    
            elif provider == 'facebook':
                # Verify Facebook access token
                app_id = getattr(settings, 'FACEBOOK_APP_ID', None)
                app_secret = getattr(settings, 'FACEBOOK_APP_SECRET', None)
                
                if not app_id or not app_secret:
                    logger.error("Facebook app credentials not configured - OAuth verification FAILED")
                    # Always fail closed - never bypass OAuth verification
                    return False
                
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
                            return False
                        # For Facebook, we need to get the user's email from the graph API
                        # using the access token
                        user_response = requests.get(
                            'https://graph.facebook.com/me',
                            params={
                                'fields': 'email',
                                'access_token': token
                            },
                            timeout=5
                        )
                        if user_response.status_code == 200:
                            user_data = user_response.json()
                            if expected_email and user_data.get('email') != expected_email:
                                logger.warning("Facebook token email mismatch")
                                return False
                        else:
                            logger.warning(f"Facebook email verification failed: {user_response.status_code}")
                            return False
                        return True
                logger.warning(f"Facebook token verification failed: {response.status_code}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"OAuth verification request failed: {e}")
            # Security: Always fail closed on network errors - never bypass OAuth verification
            return False
        
        return False

    def create_or_get_user(self, validated_data):
        provider = validated_data['provider']
        provider_id = validated_data['provider_id']
        email = validated_data['email']
        
        # Try to find existing user
        user = User.objects.filter(email=email).first()
        
        if user:
            # Update social auth info
            if provider == 'google':
                user.google_id = provider_id
            elif provider == 'facebook':
                user.facebook_id = provider_id
            user.auth_provider = provider
            user.save()
            return user, False
        
        # Create new user
        user = User.objects.create_user(
            email=email,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            user_type='registered',
            auth_provider=provider,
        )
        
        if provider == 'google':
            user.google_id = provider_id
        elif provider == 'facebook':
            user.facebook_id = provider_id
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

    def validate_file(self, value):
        """
        Validate media file with comprehensive security checks:
        1. File size limit
        2. MIME type validation
        3. File extension validation
        4. Content validation using Pillow (for images)
        """
        # 1. Validate file size
        max_size_mb = int(os.environ.get('MAX_MEDIA_SIZE_MB', 50))  # Larger limit for videos
        max_size = max_size_mb * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size cannot exceed {max_size_mb}MB. "
                f"Current size: {value.size / (1024 * 1024):.2f}MB"
            )
        
        # 2. Validate MIME type
        content_type = getattr(value, 'content_type', None)
        if not content_type or content_type.lower() not in ALLOWED_MIME_TYPES:
            raise serializers.ValidationError(
                f"Invalid file type '{content_type}'. "
                f"Allowed types: {', '.join(ALLOWED_MIME_TYPES)}"
            )
        
        # 3. Validate file extension
        filename = get_valid_filename(value.name)
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Invalid file extension '{file_ext}'. "
                f"Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # 4. Validate content based on media type
        if content_type.lower() in ALLOWED_IMAGE_MIME_TYPES:
            # Validate image content using Pillow
            try:
                from PIL import Image
                # Open the file to verify it's a valid image
                img = Image.open(value)
                img.verify()  # Verify it's actually an image
                
                # Re-open for further checks (verify() closes the file)
                value.seek(0)
                img = Image.open(value)
                
                # Check for potentially malicious image formats
                if img.format not in ['JPEG', 'PNG', 'WEBP', 'GIF']:
                    raise serializers.ValidationError(
                        f"Invalid image format '{img.format}'. "
                        f"Allowed formats: JPEG, PNG, WEBP, GIF"
                    )
                
                # Check image dimensions (prevent extremely large images)
                max_dimension = 10000  # 10,000 pixels
                if img.width > max_dimension or img.height > max_dimension:
                    raise serializers.ValidationError(
                        f"Image dimensions too large: {img.width}x{img.height}. "
                        f"Maximum allowed: {max_dimension}x{max_dimension} pixels"
                    )
                
            except ImportError:
                logger.warning("Pillow not installed - skipping image content validation")
            except Exception as e:
                logger.error(f"Image validation failed: {str(e)}")
                raise serializers.ValidationError(
                    "Invalid image file. The file may be corrupted or not a valid image."
                )
        elif content_type.lower() in ALLOWED_VIDEO_MIME_TYPES:
            # Video validation - basic checks for now
            # You could add more advanced video validation here if needed
            pass
        
        return value

    def get_url(self, obj):
        """Get the full URL of the uploaded media file."""
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None


class VisitorSerializer(serializers.ModelSerializer):
    """Serializer for visitor tracking data."""
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
