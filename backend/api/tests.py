"""
Tests for API endpoints - Authentication and User Management
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from api.metrics import metrics_view, _get_client_ip, _is_trusted_proxy, _is_ip_allowed

User = get_user_model()


class UserModelTest(TestCase):
    """Tests for the CustomUser model"""
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'user_type': 'registered'
        }
    
    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.user_type, 'registered')
        self.assertTrue(user.check_password('testpass123'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    def test_create_admin_user(self):
        """Test creating an admin user"""
        admin_data = self.user_data.copy()
        admin_data['email'] = 'test_admin@example.com'
        admin_data['user_type'] = 'admin'
        admin = User.objects.create_user(**admin_data)
        self.assertEqual(admin.user_type, 'admin')
    
    def test_user_str_representation(self):
        """Test string representation of user"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), 'test@example.com')


class AuthenticationTest(TestCase):
    """Tests for authentication endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            user_type='registered'
        )
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
    
    def test_user_login(self):
        """Test user login endpoint"""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post('/api/auth/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
    
    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post('/api/auth/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_user_profile(self):
        """Test getting user profile with authentication"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
    
    def test_unauthenticated_profile_access(self):
        """Test accessing profile without authentication"""
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserUpdateTest(TestCase):
    """Tests for user update endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            user_type='registered'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_update_email(self):
        """Test updating email"""
        data = {'email': 'newemail@example.com'}
        response = self.client.patch('/api/auth/profile/update/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'newemail@example.com')
    
    def test_update_password(self):
        """Test updating password"""
        data = {
            'current_password': 'testpass123',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        response = self.client.post('/api/auth/password/change/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))


class MetricsViewTests(TestCase):
    """Tests for metrics_view function"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user_model = get_user_model()
        # Check if staff user exists, if not create
        self.staff_user, created = self.user_model.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'password': self.user_model.objects.make_random_password(),
                'is_staff': True,
                'is_superuser': True
            }
        )
        
    def test_metrics_view_requires_auth_or_allowed_ip(self):
        """Test metrics endpoint requires authenticated staff or allowed IP"""
        # Test authenticated user that is not staff
        regular_user = self.user_model.objects.create_user(
            email='user@example.com',
            password='testpassword'
        )
        login_successful = self.client.login(email='user@example.com', password='testpassword')
        print('Login successful:', login_successful)
        print('User type:', regular_user.user_type)
        print('Is staff:', regular_user.is_staff)
        
        # Mock request with disallowed IP address
        from django.test.client import RequestFactory
        factory = RequestFactory()
        request = factory.get('/metrics/')
        request.user = regular_user
        request.META['REMOTE_ADDR'] = '8.8.8.8'
        response = metrics_view(request)
        
        self.assertEqual(response.status_code, 403)
        
        # Test authenticated staff user
        self.client.login(email='admin@example.com', password='testpassword')
        response = self.client.get('/metrics/')
        self.assertEqual(response.status_code, 200)
        
    def test_get_client_ip_without_proxy(self):
        """Test _get_client_ip without proxy"""
        request = type('', (), {})()
        request.META = {'REMOTE_ADDR': '192.168.1.100'}
        
        ip = _get_client_ip(request)
        self.assertEqual(ip, '192.168.1.100')
        
    def test_get_client_ip_with_proxy(self):
        """Test _get_client_ip with trusted proxy"""
        request = type('', (), {})()
        request.META = {
            'REMOTE_ADDR': '172.17.0.1',  # Docker default bridge IP
            'HTTP_X_FORWARDED_FOR': '192.168.1.100, 172.17.0.1'
        }
        
        ip = _get_client_ip(request)
        self.assertEqual(ip, '192.168.1.100')
        
    def test_get_client_ip_with_real_ip_header(self):
        """Test _get_client_ip with X-Real-IP header"""
        request = type('', (), {})()
        request.META = {
            'REMOTE_ADDR': '172.17.0.1',  # Docker default bridge IP
            'HTTP_X_REAL_IP': '192.168.1.100'
        }
        
        ip = _get_client_ip(request)
        self.assertEqual(ip, '192.168.1.100')
        
    def test_is_trusted_proxy(self):
        """Test _is_trusted_proxy function"""
        self.assertTrue(_is_trusted_proxy('127.0.0.1'))
        self.assertTrue(_is_trusted_proxy('::1'))
        self.assertTrue(_is_trusted_proxy('172.17.0.1'))
        self.assertTrue(_is_trusted_proxy('172.31.255.255'))
        self.assertTrue(_is_trusted_proxy('10.0.0.1'))
        self.assertTrue(_is_trusted_proxy('192.168.0.1'))
        
        self.assertFalse(_is_trusted_proxy('8.8.8.8'))
        self.assertFalse(_is_trusted_proxy('1.1.1.1'))
        
    def test_is_ip_allowed(self):
        """Test _is_ip_allowed function"""
        self.assertTrue(_is_ip_allowed('127.0.0.1'))
        self.assertTrue(_is_ip_allowed('::1'))
        self.assertTrue(_is_ip_allowed('172.17.0.1'))
        self.assertTrue(_is_ip_allowed('172.18.0.1'))
        self.assertTrue(_is_ip_allowed('172.31.255.255'))
        self.assertTrue(_is_ip_allowed('10.0.0.1'))
        self.assertTrue(_is_ip_allowed('192.168.0.1'))
        
        self.assertFalse(_is_ip_allowed('8.8.8.8'))
        self.assertFalse(_is_ip_allowed('1.1.1.1'))
        
    def test_is_ip_allowed_invalid_ip(self):
        """Test _is_ip_allowed with invalid IP"""
        self.assertFalse(_is_ip_allowed('invalid_ip'))
        
    def test_is_ip_allowed_invalid_range(self):
        """Test _is_ip_allowed with invalid IP range"""
        import os
        original = os.environ.get('METRICS_ALLOWED_IPS')
        os.environ['METRICS_ALLOWED_IPS'] = 'invalid_range'
        self.assertFalse(_is_ip_allowed('127.0.0.1'))
        if original is not None:
            os.environ['METRICS_ALLOWED_IPS'] = original
        else:
            del os.environ['METRICS_ALLOWED_IPS']
            
    def test_is_trusted_proxy_invalid_ip(self):
        """Test _is_trusted_proxy with invalid IP"""
        self.assertFalse(_is_trusted_proxy('invalid_ip'))
        
    def test_is_trusted_proxy_invalid_range(self):
        """Test _is_trusted_proxy with invalid IP range"""
        import os
        original = os.environ.get('TRUSTED_PROXY_IPS')
        os.environ['TRUSTED_PROXY_IPS'] = 'invalid_range'
        self.assertFalse(_is_trusted_proxy('127.0.0.1'))
        if original is not None:
            os.environ['TRUSTED_PROXY_IPS'] = original
        else:
            del os.environ['TRUSTED_PROXY_IPS']
            
    def test_update_metrics_with_visitor_metrics(self):
        """Test _update_metrics with visitor metrics"""
        from projects.models import Project
        from api.models import CustomUser, Visitor
        from interactions.models import Like
        
        # Create test data
        project = Project.objects.create(title='Test Project', slug='test-project', category='Development')
        user = CustomUser.objects.create(email='testuser@example.com')
        like = Like.objects.create(user=user, project=project, content_type='project', content_id=project.id)
        
        # Create visitors with different device types, browsers, and OS
        Visitor.objects.create(session_key='session1', path='/home', device_type='desktop', browser='Chrome', os='Windows')
        Visitor.objects.create(session_key='session1', path='/about', device_type='desktop', browser='Chrome', os='Windows')
        Visitor.objects.create(session_key='session2', path='/home', device_type='mobile', browser='Safari', os='iOS')
        Visitor.objects.create(session_key='session3', path='/home', device_type='desktop', browser='Firefox', os='Linux')
        
        # Call _update_metrics
        from api.metrics import _update_metrics
        _update_metrics()
        
    def test_metrics_cache_hit(self):
        """Test metrics view with cached metrics"""
        from django.core.cache import cache
        from api.metrics import METRICS_CACHE_KEY
        
        # Set test cache value
        cache.set(METRICS_CACHE_KEY, 'test_metrics_data')
        
        # Create a staff user
        from api.models import CustomUser
        user = CustomUser.objects.create(email='teststaff@example.com', is_staff=True)
        
        # Authenticate user
        from django.test import Client
        client = Client()
        client.force_login(user)
        
        # Make metrics request
        response = client.get('/metrics/')
        
        # Assert cache is hit
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode('utf-8'), 'test_metrics_data')
        
        # Clear cache
        cache.clear()
        
    def test_is_ip_allowed_with_empty_ip(self):
        """Test _is_ip_allowed with empty IP address"""
        from api.metrics import _is_ip_allowed
        self.assertFalse(_is_ip_allowed(''))
        
    def test_get_client_ip_empty_ip(self):
        """Test _get_client_ip with empty IP"""
        request = type('', (), {})()
        request.META = {'REMOTE_ADDR': ''}
        
        ip = _get_client_ip(request)
        self.assertEqual(ip, '')
        
    def test_update_metrics_exception(self):
        """Test _update_metrics with exception"""
        from unittest.mock import patch
        with patch('api.metrics.logger') as mock_logger:
            # Mock to raise an exception when trying to count Project objects
            with patch('projects.models.Project.objects.count') as mock_count:
                mock_count.side_effect = Exception('Test exception')
                # Call _update_metrics
                from api.metrics import _update_metrics
                _update_metrics()
                # Verify that the logger.error was called with the exception
                self.assertTrue(mock_logger.error.called)
                
    def test_metrics_view_cache_get_error(self):
        """Test metrics_view with cache get error"""
        from unittest.mock import patch
        with patch('api.metrics.cache') as mock_cache:
            mock_cache.get.side_effect = Exception('Cache error')
            # Mock request
            from django.test.client import RequestFactory
            factory = RequestFactory()
            request = factory.get('/metrics/')
            request.user = self.staff_user
            request.META['REMOTE_ADDR'] = '127.0.0.1'
            # Call metrics_view
            from api.metrics import metrics_view
            response = metrics_view(request)
            self.assertEqual(response.status_code, 200)
            
    def test_metrics_view_cache_set_error(self):
        """Test metrics_view with cache set error"""
        from unittest.mock import patch
        with patch('api.metrics.cache') as mock_cache:
            mock_cache.get.return_value = None
            mock_cache.set.side_effect = Exception('Cache set error')
            # Mock request
            from django.test.client import RequestFactory
            factory = RequestFactory()
            request = factory.get('/metrics/')
            request.user = self.staff_user
            request.META['REMOTE_ADDR'] = '127.0.0.1'
            # Call metrics_view
            from api.metrics import metrics_view
            response = metrics_view(request)
            self.assertEqual(response.status_code, 200)


class RefreshTokenTest(TestCase):
    """Tests for RefreshToken model and endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            user_type='registered'
        )
    
    def test_refresh_token_creation(self):
        """Test RefreshToken model creation"""
        from api.models import RefreshToken
        
        refresh_token = RefreshToken.create_for_user(self.user)
        self.assertIsNotNone(refresh_token.token)
        self.assertEqual(refresh_token.user, self.user)
        self.assertIsNone(refresh_token.revoked_at)
    
    def test_refresh_token_verify_valid(self):
        """Test verifying a valid refresh token"""
        from api.models import RefreshToken
        
        refresh_token = RefreshToken.create_for_user(self.user)
        is_valid = refresh_token.is_valid()
        self.assertTrue(is_valid)
    
    def test_refresh_token_revoke(self):
        """Test revoking a refresh token"""
        from api.models import RefreshToken
        
        refresh_token = RefreshToken.create_for_user(self.user)
        refresh_token.revoke()
        
        is_valid = refresh_token.is_valid()
        self.assertFalse(is_valid)
    
    def test_refresh_token_endpoint(self):
        """Test /api/auth/refresh/ endpoint"""
        from api.models import RefreshToken
        
        # Create refresh token
        refresh_token = RefreshToken.create_for_user(self.user)
        
        # Make request with refresh token in cookie
        response = self.client.post(
            '/api/auth/refresh/',
            HTTP_COOKIE=f'refresh_token={refresh_token.token}'
        )
        
        # Should return new access token
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)


class OAuthStateTest(TestCase):
    """Tests for OAuth state tokens (CSRF protection)"""
    
    def test_oauth_state_creation(self):
        """Test creating OAuth state token"""
        from api.models import OAuthState
        
        oauth_state = OAuthState.create_for_provider('github')
        self.assertIsNotNone(oauth_state.state)
        self.assertIsNotNone(oauth_state.nonce)
        self.assertEqual(oauth_state.provider, 'github')
        self.assertIsNotNone(oauth_state.expires_at)
    
    def test_oauth_state_verify_valid(self):
        """Test verifying valid OAuth state"""
        from api.models import OAuthState
        
        oauth_state = OAuthState.create_for_provider('github')
        verified_state = OAuthState.verify_and_consume(oauth_state.state, 'github')
        
        self.assertIsNotNone(verified_state)
        self.assertEqual(verified_state.nonce, oauth_state.nonce)
    
    def test_oauth_state_verify_invalid(self):
        """Test verifying invalid OAuth state"""
        from api.models import OAuthState
        
        verified_state = OAuthState.verify_and_consume('invalid_state', 'github')
        self.assertIsNone(verified_state)
    
    def test_oauth_state_one_time_use(self):
        """Test that used OAuth state cannot be reused"""
        from api.models import OAuthState
        
        oauth_state = OAuthState.create_for_provider('github')
        state_value = oauth_state.state
        
        # First verification should work
        verified1 = OAuthState.verify_and_consume(state_value, 'github')
        self.assertIsNotNone(verified1)
        
        # Second verification should fail (already consumed)
        verified2 = OAuthState.verify_and_consume(state_value, 'github')
        self.assertIsNone(verified2)
    
    def test_oauth_state_endpoint(self):
        """Test GET /api/auth/oauth-state/ endpoint"""
        response = self.client.get('/api/auth/oauth-state/?provider=github')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('state', response.data)
        self.assertIn('nonce', response.data)
        self.assertEqual(response.data['provider'], 'github')
    
    def test_oauth_state_invalid_provider(self):
        """Test oauth-state endpoint with invalid provider"""
        response = self.client.get('/api/auth/oauth-state/?provider=invalid')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class VisitorConsentTest(TestCase):
    """Tests for GDPR compliance - Visitor consent"""
    
    def test_visitor_consent_creation(self):
        """Test creating VisitorConsent record"""
        from api.models import VisitorConsent
        
        consent = VisitorConsent.get_or_create_consent('test_session')
        self.assertIsNotNone(consent)
        self.assertEqual(consent.session_key, 'test_session')
    
    def test_visitor_consent_has_valid_consent(self):
        """Test checking if consent is valid"""
        from api.models import VisitorConsent
        
        consent = VisitorConsent.get_or_create_consent('test_session')
        # Initially, tracking is not consented
        has_consent = consent.has_tracking_consent()
        self.assertFalse(has_consent)
    
    def test_visitor_anonymized_ip(self):
        """Test that visitor IP is anonymized"""
        from api.models import Visitor, VisitorConsent
        
        consent = VisitorConsent.get_or_create_consent('test_session')
        
        visitor = Visitor.objects.create(
            session_key='test_session',
            ip_address='192.168.1.100',
            path='/home',
            consent_record=consent
        )
        
        # IP should be anonymized (last octet = 0)
        self.assertEqual(visitor.ip_address, '192.168.1.0')
    
    def test_visitor_auto_delete_after_retention(self):
        """Test that visitors are deleted after retention period"""
        from api.models import Visitor, VisitorConsent
        from django.utils import timezone
        
        consent = VisitorConsent.get_or_create_consent('test_session')
        
        # Create visitor with expired deletion date
        visitor = Visitor.objects.create(
            session_key='test_session',
            ip_address='192.168.1.100',
            path='/home',
            consent_record=consent,
            will_delete_at=timezone.now()  # Expired
        )
        
        # Run cleanup command
        from api.management.commands.cleanup_expired_visitors import Command
        cmd = Command()
        cmd.handle()
        
        # Check visitor is deleted
        self.assertFalse(Visitor.objects.filter(id=visitor.id).exists())


class FileUploadValidationTest(TestCase):
    """Tests for file upload validation (magic bytes)"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            user_type='registered'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_valid_jpeg_upload(self):
        """Test uploading valid JPEG file"""
        import io
        
        # Create a minimal valid JPEG
        jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF'
        jpeg_file = io.BytesIO(jpeg_data)
        jpeg_file.name = 'test.jpg'
        
        response = self.client.post(
            '/api/upload/',
            {'file': jpeg_file},
            format='multipart'
        )
        
        # Should accept valid JPEG
        self.assertIn(response.status_code, [200, 201])
    
    def test_exe_disguised_as_jpg(self):
        """Test that .exe file disguised as .jpg is rejected"""
        import io
        
        # Create fake EXE file (not valid JPEG magic bytes)
        exe_data = b'MZ\x90\x00'  # EXE header
        exe_file = io.BytesIO(exe_data)
        exe_file.name = 'malware.jpg'  # Disguised as JPG
        
        response = self.client.post(
            '/api/upload/',
            {'file': exe_file},
            format='multipart'
        )
        
        # Should reject because magic bytes are EXE, not JPEG
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_file_size_limit(self):
        """Test that oversized files are rejected"""
        import io
        
        # Create a 20MB file (limit is 10MB for images)
        large_file = io.BytesIO(b'\xff\xd8\xff\xe0' + (b'x' * (20 * 1024 * 1024)))
        large_file.name = 'large.jpg'
        
        response = self.client.post(
            '/api/upload/',
            {'file': large_file},
            format='multipart'
        )
        
        # Should reject because file too large
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SecurityHeadersTest(TestCase):
    """Tests for security headers and CSRF protection"""
    
    def test_oauth_csrf_protection(self):
        """Test CSRF protection on OAuth endpoint"""
        import json
        
        # Try to authenticate without state parameter
        response = self.client.post(
            '/api/auth/social/',
            json.dumps({
                'provider': 'github',
                'code': 'invalid_code'
            }),
            content_type='application/json'
        )
        
        # Should reject missing state parameter
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('state', str(response.data).lower())
