
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import (
    Project, MediaItem, Skill, About, Like, ContactMessage, Notification, 
    EmailSubscription, SiteSettings, CVExperience, CVEducation, CVSkill, 
    CVLanguage, CVCertification, CVProject, CVInterest
)

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


class MediaItemSerializer(serializers.ModelSerializer):
    likes_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = MediaItem
        fields = '__all__'
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, media=obj).exists()
        return False


class ProjectSerializer(serializers.ModelSerializer):
    media = MediaItemSerializer(many=True, read_only=True)
    likes_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, project=obj).exists()
        return False


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'


class AboutSerializer(serializers.ModelSerializer):
    class Meta:
        model = About
        fields = '__all__'


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = '__all__'


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ['status', 'admin_reply', 'replied_at', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = '__all__'
    
    def get_is_read(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user in obj.is_read.all()
        return False


class EmailSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailSubscription
        fields = '__all__'


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = '__all__'


# ============ CV Serializers ============

class CVExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVExperience
        fields = '__all__'


class CVEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVEducation
        fields = '__all__'


class CVSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVSkill
        fields = '__all__'


class CVLanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVLanguage
        fields = '__all__'


class CVCertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVCertification
        fields = '__all__'


class CVProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVProject
        fields = '__all__'


class CVInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVInterest
        fields = '__all__'


class CVFullSerializer(serializers.Serializer):
    """Serializer for full CV data"""
    personal_info = serializers.DictField()
    experiences = CVExperienceSerializer(many=True)
    education = CVEducationSerializer(many=True)
    skills = CVSkillSerializer(many=True)
    languages = CVLanguageSerializer(many=True)
    certifications = CVCertificationSerializer(many=True)
    projects = CVProjectSerializer(many=True)
    interests = CVInterestSerializer(many=True)
