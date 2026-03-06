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
    issuing_organization = serializers.CharField(source='issuer')
    expiration_date = serializers.DateField(source='expiry_date')

    class Meta:
        model = CVCertification
        fields = [
            'id', 'name', 'issuing_organization', 'issue_date', 'expiration_date',
            'credential_id', 'credential_url', 'description', 'order', 'created_at'
        ]
    
    def to_internal_value(self, data):
        # Map frontend fields to backend fields for deserialization
        if 'issuing_organization' in data:
            data['issuer'] = data.pop('issuing_organization')
        if 'expiration_date' in data:
            data['expiry_date'] = data.pop('expiration_date')
        return super().to_internal_value(data)


class CVProjectSerializer(serializers.ModelSerializer):
    technologies = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    live_url = serializers.URLField(source='url')

    class Meta:
        model = CVProject
        fields = [
            'id', 'title', 'description', 'technologies', 'github_url', 'live_url',
            'start_date', 'end_date', 'is_ongoing', 'order', 'created_at'
        ]
        
    def to_representation(self, instance):
        # Convert string to list when reading
        representation = super().to_representation(instance)
        if instance.technologies:
            representation['technologies'] = [tech.strip() for tech in instance.technologies.split(',') if tech.strip()]
        else:
            representation['technologies'] = []
        return representation
    
    def to_internal_value(self, data):
        # Map frontend fields to backend fields for deserialization
        if 'live_url' in data:
            data['url'] = data.pop('live_url')
        return super().to_internal_value(data)
        
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
