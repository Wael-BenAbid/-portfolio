"""
Tests for Projects API endpoints
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Project, Skill

User = get_user_model()


class SkillModelTest(TestCase):
    """Tests for the Skill model"""
    
    def setUp(self):
        self.skill_data = {
            'name': 'Python',
            'category': 'backend',
            'proficiency': 90
        }
    
    def test_create_skill(self):
        """Test creating a skill"""
        skill = Skill.objects.create(**self.skill_data)
        self.assertEqual(skill.name, 'Python')
        self.assertEqual(skill.category, 'backend')
        self.assertEqual(skill.proficiency, 90)
    
    def test_skill_str_representation(self):
        """Test string representation of skill"""
        skill = Skill.objects.create(**self.skill_data)
        self.assertEqual(str(skill), 'Python')


class ProjectModelTest(TestCase):
    """Tests for the Project model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='admin'
        )
        self.project_data = {
            'title': 'Test Project',
            'description': 'A test project description',
            'technologies': 'Python, Django, React',
            'category': 'web',
            'featured': True
        }
    
    def test_create_project(self):
        """Test creating a project"""
        project = Project.objects.create(**self.project_data)
        self.assertEqual(project.title, 'Test Project')
        self.assertEqual(project.description, 'A test project description')
        self.assertTrue(project.featured)
    
    def test_project_str_representation(self):
        """Test string representation of project"""
        project = Project.objects.create(**self.project_data)
        self.assertEqual(str(project), 'Test Project')


class ProjectAPITest(TestCase):
    """Tests for Project API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='admin'
        )
        self.project = Project.objects.create(
            title='Test Project',
            description='A test project',
            technologies='Python, Django',
            category='web'
        )
    
    def test_list_projects(self):
        """Test listing all projects"""
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_retrieve_project(self):
        """Test retrieving a single project"""
        response = self.client.get(f'/api/projects/{self.project.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Project')
    
    def test_create_project_unauthenticated(self):
        """Test creating project without authentication"""
        data = {
            'title': 'New Project',
            'description': 'New project description',
            'technologies': 'React, Node.js',
            'category': 'web'
        }
        response = self.client.post('/api/projects/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_project_authenticated(self):
        """Test creating project with authentication"""
        self.client.force_authenticate(user=self.user)
        data = {
            'title': 'New Project',
            'description': 'New project description',
            'technologies': 'React, Node.js',
            'category': 'web'
        }
        response = self.client.post('/api/projects/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_update_project(self):
        """Test updating a project"""
        self.client.force_authenticate(user=self.user)
        data = {'title': 'Updated Project'}
        response = self.client.patch(f'/api/projects/{self.project.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.title, 'Updated Project')
    
    def test_delete_project(self):
        """Test deleting a project"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/projects/{self.project.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Project.objects.count(), 0)


class SkillAPITest(TestCase):
    """Tests for Skill API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='admin'
        )
        self.skill = Skill.objects.create(
            name='Python',
            category='backend',
            proficiency=90
        )
    
    def test_list_skills(self):
        """Test listing all skills"""
        response = self.client.get('/api/skills/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_skill_authenticated(self):
        """Test creating skill with authentication"""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'JavaScript',
            'category': 'frontend',
            'proficiency': 85
        }
        response = self.client.post('/api/skills/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
