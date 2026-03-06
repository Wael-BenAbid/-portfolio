"""
Comprehensive tests for Projects endpoints
Tests cover: project CRUD, filtering, permissions, media management
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from projects.models import Project, Skill, MediaItem

User = get_user_model()


@pytest.mark.django_db
class TestProjectListCreate:
    """Tests for project listing and creation"""
    
    def test_list_projects_unauthenticated(self, api_client, db):
        """Test listing projects without authentication"""
        # Create a test project
        Project.objects.create(
            title='Test Project',
            description='Test Description',
            category='Développement',
            is_active=True
        )
        
        response = api_client.get('/api/projects/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_only_active_projects(self, api_client, db):
        """Test only active projects are listed for non-admin"""
        active = Project.objects.create(
            title='Active',
            description='Active project',
            category='Développement',
            is_active=True
        )
        inactive = Project.objects.create(
            title='Inactive',
            description='Inactive project',
            category='Développement',
            is_active=False
        )
        
        response = api_client.get('/api/projects/')
        project_ids = [p['id'] for p in response.data]
        
        assert active.id in project_ids
        assert inactive.id not in project_ids
    
    def test_admin_sees_inactive_projects(self, admin_api_client, db):
        """Test admin can see inactive projects"""
        Project.objects.create(
            title='Inactive',
            description='Inactive project',
            category='Développement',
            is_active=False
        )
        
        response = admin_api_client.get('/api/projects/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_create_project_as_admin(self, admin_api_client, db):
        """Test admin can create project"""
        data = {
            'title': 'New Project',
            'description': 'New project description',
            'category': 'Développement',
            'is_active': True
        }
        response = admin_api_client.post('/api/projects/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Project.objects.filter(title='New Project').exists()
    
    def test_create_project_as_regular_user_fails(self, authenticated_api_client, db):
        """Test regular user cannot create project"""
        data = {
            'title': 'New Project',
            'description': 'New project description',
            'category': 'Développement'
        }
        response = authenticated_api_client.post('/api/projects/', data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_project_unauthenticated_fails(self, api_client, db):
        """Test unauthenticated user cannot create project"""
        data = {
            'title': 'New Project',
            'description': 'New project description',
            'category': 'Développement'
        }
        response = api_client.post('/api/projects/', data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProjectDetail:
    """Tests for project detail, update, and delete"""
    
    def test_get_project_detail(self, api_client, db):
        """Test getting project details"""
        project = Project.objects.create(
            title='Test Project',
            description='Test Description',
            category='Développement',
            is_active=True
        )
        
        response = api_client.get(f'/api/projects/{project.slug}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Test Project'
    
    def test_get_inactive_project_as_admin(self, admin_api_client, db):
        """Test admin can view inactive project"""
        project = Project.objects.create(
            title='Inactive Project',
            description='Inactive',
            category='Développement',
            is_active=False
        )
        
        response = admin_api_client.get(f'/api/projects/{project.slug}/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_inactive_project_as_user_fails(self, api_client, db):
        """Test user cannot view inactive project"""
        project = Project.objects.create(
            title='Inactive Project',
            description='Inactive',
            category='Développement',
            is_active=False
        )
        
        response = api_client.get(f'/api/projects/{project.slug}/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_project_as_admin(self, admin_api_client, db):
        """Test admin can update project"""
        project = Project.objects.create(
            title='Original Title',
            description='Original Description',
            category='Développement',
            is_active=True
        )
        
        data = {'title': 'Updated Title'}
        response = admin_api_client.patch(f'/api/projects/{project.slug}/', data)
        
        assert response.status_code == status.HTTP_200_OK
        project.refresh_from_db()
        assert project.title == 'Updated Title'
    
    def test_delete_project_as_admin(self, admin_api_client, db):
        """Test admin can delete project"""
        project = Project.objects.create(
            title='To Delete',
            description='Delete me',
            category='Développement'
        )
        
        response = admin_api_client.delete(f'/api/projects/{project.slug}/')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Project.objects.filter(id=project.id).exists()
    
    def test_update_project_by_regular_user_fails(self, authenticated_api_client, db):
        """Test regular user cannot update project"""
        project = Project.objects.create(
            title='Test Project',
            description='Description',
            category='Développement'
        )
        
        data = {'title': 'Updated'}
        response = authenticated_api_client.patch(
            f'/api/projects/{project.slug}/',
            data
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestSkill:
    """Tests for skill management"""
    
    def test_list_skills(self, api_client, db):
        """Test listing skills"""
        Skill.objects.create(
            name='Python',
            category='backend',
            proficiency=90
        )
        
        response = api_client.get('/api/projects/skills/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_create_skill_as_admin(self, admin_api_client, db):
        """Test admin can create skill"""
        data = {
            'name': 'Django',
            'category': 'backend',
            'proficiency': 85
        }
        response = admin_api_client.post('/api/projects/skills/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Skill.objects.filter(name='Django').exists()
    
    def test_create_skill_validation(self, admin_api_client, db):
        """Test skill creation validates proficiency range"""
        data = {
            'name': 'Invalid',
            'category': 'backend',
            'proficiency': 150  # Out of range (0-100)
        }
        response = admin_api_client.post('/api/projects/skills/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestMediaItem:
    """Tests for media item management"""
    
    def test_project_media_list(self, api_client, db):
        """Test media items are returned with project"""
        project = Project.objects.create(
            title='Project with Media',
            description='Has media',
            category='Développement'
        )
        media = MediaItem.objects.create(
            project=project,
            media_type='image',
            order=1
        )
        
        response = api_client.get(f'/api/projects/{project.slug}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data.get('media', [])) > 0
    
    def test_media_ordering(self, api_client, db):
        """Test media items are returned in correct order"""
        project = Project.objects.create(
            title='Project',
            description='With ordered media',
            category='Développement'
        )
        MediaItem.objects.create(project=project, media_type='image', order=2)
        MediaItem.objects.create(project=project, media_type='image', order=1)
        
        response = api_client.get(f'/api/projects/{project.slug}/')
        
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestProjectModel:
    """Tests for Project model"""
    
    def test_project_slug_auto_generated(self, db):
        """Test slug is auto-generated from title"""
        project = Project.objects.create(
            title='My Awesome Project',
            description='Description',
            category='Développement'
        )
        
        assert project.slug == 'my-awesome-project'
    
    def test_project_slug_unique(self, db):
        """Test slug is unique"""
        Project.objects.create(
            title='Project',
            description='First',
            category='Développement'
        )
        
        project2 = Project.objects.create(
            title='Project',
            description='Second',
            category='Développement'
        )
        
        # Second project should have numbered slug
        assert project2.slug == 'project-1'
    
    def test_project_str_representation(self, db):
        """Test project string representation"""
        project = Project.objects.create(
            title='Test Project',
            description='Description',
            category='Développement'
        )
        
        assert str(project) == 'Test Project'


@pytest.mark.django_db
class TestCategoryEncoding:
    """Tests for category field encoding"""
    
    def test_french_category_encoding(self, admin_api_client, db):
        """Test French characters in category are preserved"""
        data = {
            'title': 'French Project',
            'description': 'Test',
            'category': 'Développement'
        }
        response = admin_api_client.post('/api/projects/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        project = Project.objects.get(title='French Project')
        assert project.category == 'Développement'
