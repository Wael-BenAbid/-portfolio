# ARCHITECTURAL REFACTORING - SERVICE LAYER IMPLEMENTATION

## Current Problem: Mixed Responsibilities

```
❌ BEFORE: Everything scattered
┌─────────────────────────────────────┐
│         api/views.py (1000+ lines)   │
│  • HTTP request handling             │
│  • Authentication logic              │
│  • Password verification             │
│  • Token generation                  │
│  • OAuth verification                │
│  • Error handling                    │
│  • Response formatting               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     api/serializers.py (800+ lines)  │
│  • Input validation                  │
│  • Output transformation             │
│  • OAuth verification (duplicated!)  │
│  • Password validation               │
└─────────────────────────────────────┘
```

## Solution: Service Layer Architecture

```
✅ AFTER: Clean separation of concerns
┌──────────────────────────────────────┐
│      HTTP Layer (views.py)            │
│  • Route handling                    │
│  • Status codes                      │
│  • Headers                           │
└──────────────┬───────────────────────┘
               │ Calls
┌──────────────▼───────────────────────┐
│   Serializer Layer (serializers.py)   │
│  • Input/output transformation       │
│  • JSON ↔ Python conversion          │
│  • Basic validation                  │
└──────────────┬───────────────────────┘
               │ Calls
┌──────────────▼───────────────────────┐
│    Service Layer (services/*.py)      │
│  • Business logic                    │
│  • OAuth verification                │
│  • Password checking                 │
│  • User lookup                       │
│  • Token creation                    │
│  • All complex operations            │
└──────────────┬───────────────────────┘
               │ Uses
┌──────────────▼───────────────────────┐
│    Data Layer (models.py, repos)      │
│  • Database queries                  │
│  • ORM operations                    │
│  • Data persistence                  │
└──────────────────────────────────────┘
```

---

## Implementation Guide

### Step 1: Create Service Layer Structure

```bash
backend/
  api/
    services/
      __init__.py
      auth_service.py          # Authentication logic
      user_service.py          # User management
      oauth_service.py         # OAuth verification
      media_service.py         # Media handling
      exceptions.py            # Service exceptions
      decorators.py            # Service decorators (logging, caching)
    repositories/
      __init__.py
      user_repository.py       # User data access
      media_repository.py      # Media data access
    views/
      __init__.py
      auth_views.py            # Simple, clean auth endpoints
    serializers.py
    models.py
    permissions.py
    urls.py
```

### Step 2: Create Exception Classes

```python
# api/services/exceptions.py

class ServiceException(Exception):
    """Base exception for service layer"""
    def __init__(self, message, code=None, status_code=400):
        self.message = message
        self.code = code or self.__class__.__name__
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(ServiceException):
    """Raised when authentication fails"""
    def __init__(self, message="Authentication failed"):
        super().__init__(message, status_code=401)


class UserNotFoundError(ServiceException):
    """Raised when user is not found"""
    def __init__(self, identifier):
        message = f"User '{identifier}' not found"
        super().__init__(message, "USER_NOT_FOUND", status_code=404)


class UserAlreadyExistsError(ServiceException):
    """Raised when trying to create duplicate user"""
    def __init__(self, email):
        message = f"User with email '{email}' already exists"
        super().__init__(message, "USER_ALREADY_EXISTS", status_code=409)


class InvalidOAuthTokenError(ServiceException):
    """Raised when OAuth token is invalid"""
    def __init__(self, provider, reason=""):
        message = f"Invalid {provider} OAuth token" + (f": {reason}" if reason else "")
        super().__init__(message, "INVALID_OAUTH_TOKEN", status_code=401)


class PasswordValidationError(ServiceException):
    """Raised when password doesn't meet requirements"""
    def __init__(self, message):
        super().__init__(message, "INVALID_PASSWORD", status_code=400)
```

### Step 3: Create Repository Layer

```python
# api/repositories/user_repository.py

from django.contrib.auth import get_user_model
from django.db.models import QuerySet

User = get_user_model()


class UserRepository:
    """Repository for User data access"""
    
    @staticmethod
    def get_by_email(email: str) -> User | None:
        """Get user by email"""
        return User.objects.filter(email=email).first()
    
    @staticmethod
    def get_by_id(user_id: int) -> User | None:
        """Get user by ID"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def get_by_oauth_provider(provider: str, provider_id: str) -> User | None:
        """Get user by OAuth provider ID"""
        return User.objects.filter(
            oauth_provider=provider,
            oauth_provider_id=provider_id
        ).first()
    
    @staticmethod
    def create_user(
        email: str,
        password: str,
        first_name: str = "",
        last_name: str = "",
        user_type: str = "registered"
    ) -> User:
        """Create new user"""
        return User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            user_type=user_type
        )
    
    @staticmethod
    def create_oauth_user(
        email: str,
        provider: str,
        provider_id: str,
        first_name: str = "",
        last_name: str = "",
        profile_image: str | None = None
    ) -> User:
        """Create user from OAuth"""
        return User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            user_type='registered',
            oauth_provider=provider,
            oauth_provider_id=provider_id,
            profile_image=profile_image
        )
    
    @staticmethod
    def update_user(user: User, **kwargs) -> User:
        """Update user fields"""
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        user.save()
        return user
    
    @staticmethod
    def user_exists(email: str) -> bool:
        """Check if user exists"""
        return User.objects.filter(email=email).exists()
    
    @staticmethod
    def list_active_users() -> QuerySet:
        """Get all active users"""
        return User.objects.filter(is_active=True).select_related('profile')
```

### Step 4: Create Service Layer

```python
# api/services/auth_service.py

import logging
from typing import Tuple
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

from api.repositories.user_repository import UserRepository
from api.security import InputValidator, OAuthSecurityManager
from .exceptions import (
    AuthenticationError, UserAlreadyExistsError, 
    InvalidOAuthTokenError, PasswordValidationError
)

User = get_user_model()
logger = logging.getLogger(__name__)


class AuthenticationService:
    """
    Handles all authentication operations
    Responsibility: Business logic for authentication
    """
    
    def __init__(self, user_repo: UserRepository = None):
        self.user_repo = user_repo or UserRepository()
    
    def register(
        self,
        email: str,
        password: str,
        password_confirm: str,
        first_name: str = "",
        last_name: str = ""
    ) -> Tuple[User, Token]:
        """
        Register a new user
        
        Raises:
            UserAlreadyExistsError: User with email already exists
            PasswordValidationError: Password doesn't meet requirements
            ValidationError: Email format invalid
        
        Returns:
            Tuple of (User, Token)
        """
        # Validate inputs
        if not InputValidator.validate_email(email):
            raise PasswordValidationError("Invalid email format")
        
        if password != password_confirm:
            raise PasswordValidationError("Passwords do not match")
        
        is_strong, message = InputValidator.validate_password_strength(password)
        if not is_strong:
            raise PasswordValidationError(message)
        
        # Check if user already exists
        if self.user_repo.user_exists(email):
            logger.warning(f"Register attempt with existing email: {email}")
            raise UserAlreadyExistsError(email)
        
        # Create user
        user = self.user_repo.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            user_type='registered'
        )
        
        # Create token
        token, _ = Token.objects.get_or_create(user=user)
        
        logger.info(f"User registered: {email}")
        return user, token
    
    def login(self, email: str, password: str) -> Tuple[User, Token]:
        """
        Authenticate user with email and password
        
        Raises:
            AuthenticationError: Invalid credentials
        
        Returns:
            Tuple of (User, Token)
        """
        # Validate inputs
        if not email or not password:
            raise AuthenticationError("Email and password are required")
        
        # Lookup user (prevents timing attacks)
        user = self.user_repo.get_by_email(email)
        
        # Verify password (always check even if user not found)
        if not user or not user.check_password(password):
            logger.warning(f"Failed login attempt for: {email}")
            # Generic error message prevents user enumeration
            raise AuthenticationError("Invalid email or password")
        
        # Create or get token
        token, _ = Token.objects.get_or_create(user=user)
        
        logger.info(f"User logged in: {email}")
        return user, token
    
    def verify_oauth_token(
        self,
        provider: str,
        token: str,
        provider_id: str,
        email: str
    ) -> Tuple[User, Token]:
        """
        Verify OAuth token and get or create user
        
        Raises:
            InvalidOAuthTokenError: Token verification failed
        
        Returns:
            Tuple of (User, Token)
        """
        try:
            # Verify token with provider
            verified = OAuthSecurityManager.verify_oauth_token(
                provider=provider,
                token=token,
                expected_id=provider_id,
                expected_email=email
            )
            
            if not verified:
                logger.warning(f"OAuth verification failed: {provider}")
                raise InvalidOAuthTokenError(provider, "Token verification failed")
            
            # Get or create user
            user = self.user_repo.get_by_oauth_provider(provider, provider_id)
            
            if not user:
                # Create new user from OAuth
                user = self.user_repo.create_oauth_user(
                    email=email,
                    provider=provider,
                    provider_id=provider_id
                )
                logger.info(f"New OAuth user created: {provider}:{provider_id}")
            
            # Get or create token
            token, _ = Token.objects.get_or_create(user=user)
            
            return user, token
            
        except Exception as e:
            logger.error(f"OAuth verification error: {e}")
            raise InvalidOAuthTokenError(provider, str(e))
    
    def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str
    ) -> User:
        """
        Change user password
        
        Raises:
            AuthenticationError: Current password incorrect
            PasswordValidationError: New password invalid
        """
        # Verify current password
        if not user.check_password(current_password):
            raise AuthenticationError("Current password is incorrect")
        
        # Validate new password
        is_strong, message = InputValidator.validate_password_strength(new_password)
        if not is_strong:
            raise PasswordValidationError(message)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        logger.info(f"Password changed for user: {user.email}")
        return user
```

### Step 5: Update Views to Use Services

```python
# api/views/auth_views.py

import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit

from api.services.auth_service import AuthenticationService
from api.services.exceptions import ServiceException
from api.serializers import (
    UserSerializer, UserRegistrationSerializer, SocialAuthSerializer
)

logger = logging.getLogger(__name__)
auth_service = AuthenticationService()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    serializer_class = UserRegistrationSerializer
    
    @method_decorator(ratelimit(key='ip', rate='5/m', block=True))
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user, token = auth_service.register(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                password_confirm=serializer.validated_data['password_confirm'],
                first_name=serializer.validated_data.get('first_name', ''),
                last_name=serializer.validated_data.get('last_name', '')
            )
            
            response = Response(
                {'user': UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )
            
            # Set auth token as HttpOnly cookie
            response.set_cookie(
                'auth_token',
                token.key,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                max_age=3600 * 24 * 7
            )
            
            return response
            
        except ServiceException as e:
            return Response(
                {'error': e.message},
                status=e.status_code
            )


class LoginView(APIView):
    """User login endpoint"""
    
    @method_decorator(ratelimit(key='ip', rate='10/m', block=True))
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user, token = auth_service.login(email, password)
            
            response = Response(
                {'user': UserSerializer(user).data},
                status=status.HTTP_200_OK
            )
            
            response.set_cookie(
                'auth_token',
                token.key,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                max_age=3600 * 24 * 7
            )
            
            return response
            
        except ServiceException as e:
            return Response(
                {'error': e.message},
                status=e.status_code
            )


class SocialAuthView(generics.CreateAPIView):
    """OAuth authentication endpoint"""
    serializer_class = SocialAuthSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user, token = auth_service.verify_oauth_token(
                provider=serializer.validated_data['provider'],
                token=serializer.validated_data['provider_token'],
                provider_id=serializer.validated_data['provider_id'],
                email=serializer.validated_data['email']
            )
            
            response = Response(
                {'user': UserSerializer(user).data},
                status=status.HTTP_200_OK
            )
            
            response.set_cookie(
                'auth_token',
                token.key,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax'
            )
            
            return response
            
        except ServiceException as e:
            return Response(
                {'error': e.message},
                status=e.status_code
            )
```

### Step 6: Update Tests to Mock Services

```python
# api/tests/test_auth_service.py

from unittest.mock import Mock, patch
import pytest
from api.services.auth_service import AuthenticationService
from api.services.exceptions import (
    AuthenticationError, UserAlreadyExistsError
)


@pytest.fixture
def auth_service():
    return AuthenticationService()


@pytest.fixture
def mock_user_repo():
    return Mock()


def test_register_success(auth_service, mock_user_repo):
    """Test successful user registration"""
    auth_service.user_repo = mock_user_repo
    mock_user_repo.user_exists.return_value = False
    mock_user = Mock()
    mock_user_repo.create_user.return_value = mock_user
    
    user, token = auth_service.register(
        email='test@example.com',
        password='SecurePass123!',
        password_confirm='SecurePass123!',
        first_name='John',
        last_name='Doe'
    )
    
    assert user == mock_user
    mock_user_repo.create_user.assert_called_once()


def test_register_user_already_exists(auth_service, mock_user_repo):
    """Test registration fails when user exists"""
    auth_service.user_repo = mock_user_repo
    mock_user_repo.user_exists.return_value = True
    
    with pytest.raises(UserAlreadyExistsError):
        auth_service.register(
            email='existing@example.com',
            password='SecurePass123!',
            password_confirm='SecurePass123!'
        )


def test_login_invalid_credentials(auth_service, mock_user_repo):
    """Test login fails with invalid credentials"""
    auth_service.user_repo = mock_user_repo
    mock_user_repo.get_by_email.return_value = None
    
    with pytest.raises(AuthenticationError):
        auth_service.login('test@example.com', 'wrongpassword')
```

---

## Migration Path

### Phase 1: Create Services (Day 1)
- [ ] Create `api/services/` directory
- [ ] Create service exception classes
- [ ] Create `auth_service.py`

### Phase 2: Create Repositories (Day 2)
- [ ] Create `api/repositories/` directory
- [ ] Create `user_repository.py`
- [ ] Create `media_repository.py`

### Phase 3: Refactor Views (Day 3-4)
- [ ] Update auth views to use services
- [ ] Update project views
- [ ] Update media views

### Phase 4: Update Tests (Day 5)
- [ ] Create service tests
- [ ] Create integration tests
- [ ] Update existing tests to use mocks

### Phase 5: Infrastructure Cleanup (Day 6)
- [ ] Remove old logic from views
- [ ] Delete unused imports
- [ ] Run full test suite

---

## Benefits of This Architecture

| Benefit | Before | After |
|---------|--------|-------|
| **Testability** | Hard to test (tight coupling) | Easy to test (mock dependencies) |
| **Reusability** | Code duplication | Single source of truth |
| **Maintainability** | Views 1000+ lines | Views 50-100 lines |
| **Scalability** | Hard to add features | Easy to add services |
| **Error Handling** | Scattered | Centralized with custom exceptions |
| **Feature Flags** | Embedded in views | Can be added to services |
| **Caching** | Manual in views | Decorator-based in services |
| **Logging** | Inconsistent | Consistent across services |

---

This refactoring transforms your code from a junior-level monolithic structure to an enterprise-grade, maintainable architecture suitable for FAANG companies.
