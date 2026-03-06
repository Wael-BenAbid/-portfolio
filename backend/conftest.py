"""
Pytest configuration and fixtures for backend tests
Shared fixtures used across all test modules
"""
import os
import pytest
from pathlib import Path
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

User = get_user_model()


@pytest.fixture(scope='session', autouse=True)
def create_log_directories():
    """
    Create necessary log directories for logging handlers.
    Runs once per test session before any tests.
    Fixes CI/CD failures when logs/ directory doesn't exist.
    """
    log_dir = Path(__file__).parent / 'logs'
    log_dir.mkdir(exist_ok=True)
    yield


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Enable database access for all tests by default"""
    pass


@pytest.fixture
def api_client():
    """
    Fixture for DRF API client
    Usage: def test_endpoint(api_client): response = api_client.get('/api/...')
    """
    return APIClient()


@pytest.fixture
def authenticated_client(api_client):
    """
    Fixture for authenticated API client
    Usage: def test_protected_endpoint(authenticated_client, user): ...
    """
    return api_client


@pytest.fixture
def admin_user(db):
    """Create and return a test admin user"""
    user = User.objects.create_superuser(
        email='admin@example.com',
        password='adminpass123',
        user_type='admin'
    )
    return user


@pytest.fixture
def regular_user(db):
    """Create and return a test regular user"""
    user = User.objects.create_user(
        email='user@example.com',
        password='password123',
        user_type='registered',
        first_name='Test',
        last_name='User'
    )
    return user


@pytest.fixture
def visitor_user(db):
    """Create and return a test visitor (no auth)"""
    user = User.objects.create_user(
        email='visitor@example.com',
        password='password123',
        user_type='visitor'
    )
    return user


@pytest.fixture
def admin_user_with_token(admin_user):
    """Create admin user with authentication token"""
    token, _ = Token.objects.get_or_create(user=admin_user)
    return {
        'user': admin_user,
        'token': token.key
    }


@pytest.fixture
def regular_user_with_token(regular_user):
    """Create regular user with authentication token"""
    token, _ = Token.objects.get_or_create(user=regular_user)
    return {
        'user': regular_user,
        'token': token.key
    }


@pytest.fixture
def authenticated_api_client(api_client, regular_user_with_token):
    """
    Fixture for API client authenticated as regular user
    Usage: def test_my_endpoint(authenticated_api_client): ...
    """
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {regular_user_with_token["token"]}')
    return api_client


@pytest.fixture
def admin_api_client(api_client, admin_user_with_token):
    """
    Fixture for API client authenticated as admin
    Usage: def test_admin_endpoint(admin_api_client): ...
    """
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {admin_user_with_token["token"]}')
    return api_client


@pytest.fixture
def sample_project_data():
    """Sample project data for tests"""
    return {
        'title': 'Test Project',
        'description': 'This is a test project',
        'category': 'Développement',
        'thumbnail': 'https://example.com/thumbnail.jpg',
        'video_url': 'https://example.com/video.mp4',
        'project_url': 'https://example.com',
        'github_url': 'https://github.com/example/project',
        'featured': True,
        'is_active': True,
    }


@pytest.fixture
def sample_skill_data():
    """Sample skill data for tests"""
    return {
        'name': 'Python',
        'category': 'backend',
        'proficiency': 90,
        'icon': 'python-icon'
    }


@pytest.fixture
def sample_cv_experience_data():
    """Sample CV experience data for tests"""
    from datetime import date
    return {
        'title': 'Senior Developer',
        'company': 'Tech Corp',
        'location': 'San Francisco, CA',
        'start_date': date(2020, 1, 1),
        'end_date': date(2023, 12, 31),
        'is_current': False,
        'description': 'Led development of core features'
    }


@pytest.fixture
def sample_cv_education_data():
    """Sample CV education data for tests"""
    from datetime import date
    return {
        'degree': 'Computer Science',
        'institution': 'MIT',
        'location': 'Cambridge, MA',
        'start_date': date(2016, 9, 1),
        'end_date': date(2020, 5, 31),
        'is_current': False,
        'gpa': '3.9'
    }


@pytest.fixture
def env_vars(monkeypatch):
    """
    Fixture to set environment variables for tests
    Usage: def test_with_env(env_vars):
               env_vars.set('KEY', 'value')
    """
    class EnvManager:
        def set(self, key, value):
            monkeypatch.setenv(key, value)
        
        def get(self, key, default=None):
            return os.environ.get(key, default)
    
    return EnvManager()
