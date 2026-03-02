"""
Projects App - Serializers for projects and media
"""
from rest_framework import serializers
from .models import Project, MediaItem, Skill
from interactions.models import Like


class MediaItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating media items for a project"""
    project = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=Project.objects.all()
    )
    
    class Meta:
        model = MediaItem
        fields = ['id', 'project', 'media_type', 'file', 'thumbnail', 'caption', 'order']
    
    def validate(self, attrs):
        """Validate that file or thumbnail is provided based on media type"""
        media_type = attrs.get('media_type')
        file = attrs.get('file')
        thumbnail = attrs.get('thumbnail')
        
        if media_type == 'image' and not file:
            raise serializers.ValidationError({"file": "File is required for image media type"})
        
        if media_type == 'video' and not file:
            raise serializers.ValidationError({"file": "File is required for video media type"})
        
        return attrs


class MediaItemSerializer(serializers.ModelSerializer):
    likes_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    type = serializers.CharField(source='media_type', read_only=True)
    url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaItem
        fields = ['id', 'type', 'url', 'thumbnail_url', 'caption', 'order', 'likes_count', 'is_liked']
    
    def get_url(self, obj):
        """Return the URL of the uploaded file"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_thumbnail_url(self, obj):
        """Return the URL of the thumbnail"""
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, media=obj).exists()
        return False


class ProjectSerializer(serializers.ModelSerializer):
    media = MediaItemSerializer(many=True, read_only=True)
    likes_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'
        extra_kwargs = {
            'media': {'read_only': True},
        }
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, project=obj).exists()
        return False


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'
