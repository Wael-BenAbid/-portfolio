"""
Tests for CV API endpoints
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Experience, Education, Skill as CVSkill, Language, Certification

User = get_user_model()


class ExperienceModelTest(TestCase):
    """Tests for the Experience model"""
    
    def setUp(self):
        self.experience_data = {
            'title': 'Software Developer',
            'company': 'Tech Company',
            'location': 'Tunis, Tunisia',
            'start_date': '2020-01-01',
            'end_date': '2023-01-01',
            'description': 'Developed web applications',
            'current': False
        }
    
    def test_create_experience(self):
        """Test creating an experience"""
        experience = Experience.objects.create(**self.experience_data)
        self.assertEqual(experience.title, 'Software Developer')
        self.assertEqual(experience.company, 'Tech Company')
        self.assertFalse(experience.current)
    
    def test_experience_str_representation(self):
        """Test string representation of experience"""
        experience = Experience.objects.create(**self.experience_data)
        self.assertIn('Software Developer', str(experience))


class EducationModelTest(TestCase):
    """Tests for the Education model"""
    
    def setUp(self):
        self.education_data = {
            'degree': 'Master in Computer Science',
            'institution': 'University of Tunis',
            'location': 'Tunis, Tunisia',
            'start_date': '2015-09-01',
            'end_date': '2020-06-30',
            'description': 'Computer Science studies',
            'current': False
        }
    
    def test_create_education(self):
        """Test creating an education entry"""
        education = Education.objects.create(**self.education_data)
        self.assertEqual(education.degree, 'Master in Computer Science')
        self.assertEqual(education.institution, 'University of Tunis')
    
    def test_education_str_representation(self):
        """Test string representation of education"""
        education = Education.objects.create(**self.education_data)
        self.assertIn('Master in Computer Science', str(education))


class CVSkillModelTest(TestCase):
    """Tests for the CV Skill model"""
    
    def setUp(self):
        self.skill_data = {
            'name': 'Python',
            'category': 'backend',
            'proficiency': 90
        }
    
    def test_create_cv_skill(self):
        """Test creating a CV skill"""
        skill = CVSkill.objects.create(**self.skill_data)
        self.assertEqual(skill.name, 'Python')
        self.assertEqual(skill.proficiency, 90)


class LanguageModelTest(TestCase):
    """Tests for the Language model"""
    
    def setUp(self):
        self.language_data = {
            'name': 'English',
            'proficiency': 'fluent'
        }
    
    def test_create_language(self):
        """Test creating a language"""
        language = Language.objects.create(**self.language_data)
        self.assertEqual(language.name, 'English')
        self.assertEqual(language.proficiency, 'fluent')


class CertificationModelTest(TestCase):
    """Tests for the Certification model"""
    
    def setUp(self):
        self.certification_data = {
            'name': 'AWS Certified Developer',
            'issuer': 'Amazon Web Services',
            'date_obtained': '2023-01-15',
            'expiry_date': '2026-01-15',
            'credential_id': 'AWS-12345'
        }
    
    def test_create_certification(self):
        """Test creating a certification"""
        cert = Certification.objects.create(**self.certification_data)
        self.assertEqual(cert.name, 'AWS Certified Developer')
        self.assertEqual(cert.issuer, 'Amazon Web Services')


class CVAPITest(TestCase):
    """Tests for CV API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='admin'
        )
    
    def test_list_experiences(self):
        """Test listing experiences"""
        Experience.objects.create(
            title='Developer',
            company='Test Company',
            location='Tunis',
            start_date='2020-01-01',
            description='Test'
        )
        response = self.client.get('/api/cv/experiences/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_education(self):
        """Test listing education"""
        Education.objects.create(
            degree='Bachelor',
            institution='University',
            location='Tunis',
            start_date='2015-01-01',
            description='Test'
        )
        response = self.client.get('/api/cv/education/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_experience_authenticated(self):
        """Test creating experience with authentication"""
        self.client.force_authenticate(user=self.user)
        data = {
            'title': 'New Job',
            'company': 'New Company',
            'location': 'Remote',
            'start_date': '2023-01-01',
            'description': 'New position'
        }
        response = self.client.post('/api/cv/experiences/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_create_education_authenticated(self):
        """Test creating education with authentication"""
        self.client.force_authenticate(user=self.user)
        data = {
            'degree': 'PhD',
            'institution': 'MIT',
            'location': 'USA',
            'start_date': '2023-01-01',
            'description': 'Doctoral studies'
        }
        response = self.client.post('/api/cv/education/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
