"""
CV App - Serializers for CV data
"""
from rest_framework import serializers
from .models import (
    CVExperience, CVEducation, CVSkill, CVLanguage,
    CVCertification, CVProject, CVInterest
)


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
    technologies = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = CVProject
        fields = '__all__'
        
    def to_representation(self, instance):
        # Convert string to list when reading
        representation = super().to_representation(instance)
        if instance.technologies:
            representation['technologies'] = [tech.strip() for tech in instance.technologies.split(',') if tech.strip()]
        else:
            representation['technologies'] = []
        return representation
        
    def create(self, validated_data):
        # Convert list to string when creating
        if 'technologies' in validated_data:
            validated_data['technologies'] = ','.join(validated_data['technologies'])
        else:
            validated_data['technologies'] = ''
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        # Convert list to string when updating
        if 'technologies' in validated_data:
            validated_data['technologies'] = ','.join(validated_data['technologies'])
        return super().update(instance, validated_data)


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
