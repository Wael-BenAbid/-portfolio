
from rest_framework import serializers
from .models import Project, MediaItem, Skill, About

class MediaItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaItem
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    media = MediaItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = '__all__'

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class AboutSerializer(serializers.ModelSerializer):
    class Meta:
        model = About
        fields = '__all__'
