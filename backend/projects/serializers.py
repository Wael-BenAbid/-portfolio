"""
Projects App - Serializers for projects and media
"""
from rest_framework import serializers
from django.conf import settings
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
        
        # Validate file type based on media type
        if file:
            if media_type == 'image':
                allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                if file.content_type not in allowed_types:
                    raise serializers.ValidationError({"file": "Invalid image type. Allowed: JPEG, PNG, GIF, WebP"})
            elif media_type == 'video':
                allowed_types = ['video/mp4', 'video/webm', 'video/ogg']
                if file.content_type not in allowed_types:
                    raise serializers.ValidationError({"file": "Invalid video type. Allowed: MP4, WebM, OGG"})
            
            # Validate file size (max 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            if file.size > max_size:
                raise serializers.ValidationError({"file": "File too large. Maximum size is 10MB"})
        
        # Validate thumbnail type and size
        if thumbnail:
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if thumbnail.content_type not in allowed_types:
                raise serializers.ValidationError({"thumbnail": "Invalid thumbnail type. Allowed: JPEG, PNG, GIF, WebP"})
            
            max_size = 2 * 1024 * 1024  # 2MB
            if thumbnail.size > max_size:
                raise serializers.ValidationError({"thumbnail": "Thumbnail too large. Maximum size is 2MB"})
        
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
        """Return the URL of the uploaded file or external URL"""
        if obj.file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        # Only return test URLs for development or when no file is available
        if settings.DEBUG:
            test_url = f'https://picsum.photos/seed/test{obj.order}/800/600.jpg'
            request = self.context.get('request')
            return request.build_absolute_uri(test_url) if request else test_url
        return None
    
    def get_thumbnail_url(self, obj):
        """Return the URL of the thumbnail or external URL"""
        if obj.thumbnail:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        # Only return test URLs for development or when no thumbnail is available
        if settings.DEBUG:
            test_url = f'https://picsum.photos/seed/test{obj.order}/200/150.jpg'
            request = self.context.get('request')
            return request.build_absolute_uri(test_url) if request else test_url
        return None
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            # Check if we have already annotated the liked status
            if hasattr(obj, 'is_liked'):
                return obj.is_liked
            # Fallback to query if not annotated (shouldn't happen with our view changes)
            return Like.objects.filter(user=request.user, media=obj).exists()
        return False


class ProjectSerializer(serializers.ModelSerializer):
    media = MediaItemSerializer(many=True, read_only=True)
    likes_count = serializers.ReadOnlyField()
    views_count = serializers.ReadOnlyField()
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
            # Check if we have already annotated the liked status
            if hasattr(obj, 'is_liked'):
                return obj.is_liked
            # Fallback to query if not annotated (shouldn't happen with our view changes)
            return Like.objects.filter(user=request.user, project=obj).exists()
        return False
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # For media items, we need to handle liked status efficiently
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            from interactions.models import Like
            
            # Get all liked media IDs for this user in one query
            media_ids = [media.id for media in instance.media.all()]
            liked_media_ids = Like.objects.filter(
                user=request.user,
                media_id__in=media_ids,
                content_type='media'
            ).values_list('media_id', flat=True)
            
            # Update each media item's is_liked field
            if 'media' in representation:
                for media in representation['media']:
                    media['is_liked'] = media['id'] in liked_media_ids
        
        # Ensure category is properly encoded when sending to frontend
        if 'category' in representation:
            # Ensure category is properly UTF-8 encoded
            try:
                representation['category'] = representation['category'].encode('utf-8').decode('utf-8')
            except:
                pass
                
        return representation
    
    def to_internal_value(self, data):
        """Fix category encoding issue when receiving data from frontend"""
        if 'category' in data:
            try:
                # Fix UTF-8 encoding issue (e.g., "D\u00c3\u00a9veloppement" to "Développement")
                category = data['category']
                if isinstance(category, str):
                    # Try to decode if it contains UTF-8 bytes encoded as Latin-1
                    decoded_category = category.encode('latin-1').decode('utf-8')
                    data['category'] = decoded_category
            except:
                pass
                
        return super().to_internal_value(data)


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'
