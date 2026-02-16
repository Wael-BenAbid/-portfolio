"""
API Serializers - Authentication and User Management
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'user_type', 'profile_image', 'bio', 'phone', 
                  'email_notifications', 'notify_new_projects', 'notify_updates',
                  'created_at', 'first_name', 'last_name']
        read_only_fields = ['id', 'user_type', 'created_at']


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
    first_name = serializers.CharField(required=False, default='')
    last_name = serializers.CharField(required=False, default='')
    profile_image = serializers.URLField(required=False, allow_null=True)

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
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs
