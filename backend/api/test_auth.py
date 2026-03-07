"""
Comprehensive tests for API Authentication endpoints
Tests cover: login, register, logout, profile management, social auth, password change
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token

User = get_user_model()


@pytest.mark.auth
class TestUserRegistration:
    """Tests for user registration endpoint"""
    
    def test_register_user_success(self, api_client):
        """Test successful user registration"""
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        response = api_client.post('/api/auth/register/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['email'] == 'newuser@example.com'
        assert response.data['user']['user_type'] == 'registered'
        assert User.objects.filter(email='newuser@example.com').exists()
    
    def test_register_password_mismatch(self, api_client):
        """Test registration fails with mismatched passwords"""
        data = {
            'email': 'user@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'DifferentPass123!',
        }
        response = api_client.post('/api/auth/register/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in str(response.data).lower()
    
    def test_register_weak_password(self, api_client):
        """Test registration fails with weak password"""
        data = {
            'email': 'user@example.com',
            'password': '123',  # Too short
            'password_confirm': '123',
        }
        response = api_client.post('/api/auth/register/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_duplicate_email(self, api_client, regular_user):
        """Test registration fails with existing email"""
        data = {
            'email': regular_user.email,
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        }
        response = api_client.post('/api/auth/register/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_missing_email(self, api_client):
        """Test registration fails without email"""
        data = {
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        }
        response = api_client.post('/api/auth/register/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.auth
class TestUserLogin:
    """Tests for user login endpoint"""
    
    def test_login_success(self, api_client, regular_user):
        """Test successful login"""
        data = {
            'email': 'user@example.com',
            'password': 'password123'
        }
        response = api_client.post('/api/auth/login/', data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == 'user@example.com'
    
    def test_login_invalid_password(self, api_client, regular_user):
        """Test login fails with invalid password"""
        data = {
            'email': 'user@example.com',
            'password': 'wrongpassword'
        }
        response = api_client.post('/api/auth/login/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_login_nonexistent_email(self, api_client):
        """Test login fails with non-existent email"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'password123'
        }
        response = api_client.post('/api/auth/login/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_login_missing_credentials(self, api_client):
        """Test login fails with missing credentials"""
        data = {'email': 'user@example.com'}  # Missing password
        response = api_client.post('/api/auth/login/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_login_creates_token(self, api_client, regular_user):
        """Test that login creates authentication token"""
        data = {
            'email': 'user@example.com',
            'password': 'password123'
        }
        response = api_client.post('/api/auth/login/', data)
        
        assert Token.objects.filter(user=regular_user).exists()


@pytest.mark.auth
class TestUserLogout:
    """Tests for user logout endpoint"""
    
    def test_logout_success(self, authenticated_api_client, regular_user):
        """Test successful logout"""
        response = authenticated_api_client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_logout_unauthenticated(self, api_client):
        """Test logout fails for unauthenticated user"""
        response = api_client.post('/api/auth/logout/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.auth
class TestUserProfile:
    """Tests for user profile endpoints"""
    
    def test_get_profile_authenticated(self, authenticated_api_client, regular_user):
        """Test getting user profile when authenticated"""
        response = authenticated_api_client.get('/api/auth/profile/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == regular_user.email
    
    def test_get_profile_unauthenticated(self, api_client):
        """Test getting profile fails without authentication"""
        response = api_client.get('/api/auth/profile/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_update_profile_success(self, authenticated_api_client, regular_user):
        """Test updating user profile"""
        data = {
            'first_name': 'Updated',
            'bio': 'New bio'
        }
        response = authenticated_api_client.patch('/api/auth/profile/update/', data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'
        
        # Verify in database
        regular_user.refresh_from_db()
        assert regular_user.first_name == 'Updated'


@pytest.mark.auth
class TestPasswordChange:
    """Tests for password change endpoint"""
    
    def test_password_change_success(self, authenticated_api_client, regular_user):
        """Test successful password change"""
        data = {
            'current_password': 'password123',
            'new_password': 'NewSecurePass456!',
            'confirm_password': 'NewSecurePass456!'
        }
        response = authenticated_api_client.post('/api/auth/password/change/', data)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify new password works
        regular_user.refresh_from_db()
        assert regular_user.check_password('NewSecurePass456!')
        assert not regular_user.check_password('password123')
    
    def test_password_change_wrong_current(self, authenticated_api_client):
        """Test password change fails with wrong current password"""
        data = {
            'current_password': 'wrongpassword',
            'new_password': 'NewSecurePass456!',
            'new_password_confirm': 'NewSecurePass456!'
        }
        response = authenticated_api_client.post('/api/auth/password/change/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_password_change_mismatch(self, authenticated_api_client):
        """Test password change fails with mismatched passwords"""
        data = {
            'current_password': 'password123',
            'new_password': 'NewSecurePass456!',
            'new_password_confirm': 'DifferentPass456!'
        }
        response = authenticated_api_client.post('/api/auth/password/change/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_password_change_unauthenticated(self, api_client):
        """Test password change fails without authentication"""
        data = {
            'current_password': 'password123',
            'new_password': 'NewSecurePass456!',
            'new_password_confirm': 'NewSecurePass456!'
        }
        response = api_client.post('/api/auth/password/change/', data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.auth
class TestAdminUserManagement:
    """Tests for admin user management endpoints"""
    
    def test_list_users_as_admin(self, admin_api_client):
        """Test admin can list all users"""
        response = admin_api_client.get('/api/auth/admin/users/')
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data['results'], list)
        assert response.data['count'] >= 1
    
    def test_list_users_as_regular_user(self, authenticated_api_client):
        """Test regular user cannot list users"""
        response = authenticated_api_client.get('/api/auth/admin/users/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_user_detail_as_admin(self, admin_api_client, regular_user):
        """Test admin can get user details"""
        response = admin_api_client.get(f'/api/auth/admin/users/{regular_user.id}/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_update_user_as_admin(self, admin_api_client, regular_user):
        """Test admin can update user"""
        data = {
            'user_type': 'admin',
            'first_name': 'Admin Updated'
        }
        response = admin_api_client.patch(
            f'/api/auth/admin/users/{regular_user.id}/', 
            data
        )
        
        assert response.status_code == status.HTTP_200_OK
        regular_user.refresh_from_db()
        assert regular_user.user_type == 'admin'
    
    def test_delete_user_as_admin(self, admin_api_client, regular_user):
        """Test admin can delete user"""
        user_id = regular_user.id
        response = admin_api_client.delete(f'/api/auth/admin/users/{user_id}/')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(id=user_id).exists()
    
    def test_regular_user_cannot_manage_users(self, authenticated_api_client):
        """Test regular user cannot manage other users"""
        response = authenticated_api_client.get('/api/auth/admin/users/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.auth
class TestUserModel:
    """Tests for CustomUser model"""
    
    def test_create_user(self, db):
        """Test creating a regular user"""
        user = User.objects.create_user(
            email='test@example.com',
            password='password123'
        )
        
        assert user.email == 'test@example.com'
        assert user.user_type == 'visitor'  # Default
        assert user.check_password('password123')
    
    def test_create_superuser(self, db):
        """Test creating a superuser"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='password123'
        )
        
        assert user.is_staff
        assert user.is_superuser
        assert user.user_type == 'admin'
    
    def test_email_field_unique(self, db, regular_user):
        """Test email field is unique"""
        with pytest.raises(Exception):  # IntegrityError
            User.objects.create_user(
                email=regular_user.email,
                password='password123'
            )
    
    def test_user_str_representation(self, regular_user):
        """Test user string representation"""
        assert str(regular_user) == regular_user.email
