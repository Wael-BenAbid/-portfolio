"""
Interactions App - Serializers for likes and notifications
"""
from rest_framework import serializers
from .models import Like, Notification


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = '__all__'


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
