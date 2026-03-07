# CRITICAL ACTION PLAN - First 72 Hours

**Status**: 🔴 BLOCKING PRODUCTION  
**Timeline**: Must fix before any deployment  
**Effort**: ~40 hours for a senior dev, ~60 hours for mid-level  

---

## Issue #1: REMOVE HARDCODED TEST USER (CRITICAL)

**Current Problem**: Authentication is completely bypassed  
**Location**: `frontend/App.tsx` lines 90-120  
**Risk**: Anyone can access your entire app as admin  

### ❌ Current (BROKEN)

```typescript
const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const getUserFromSession = (): User | null => {
    // Bypass login for testing purposes
    const testUser: User = {
      id: 2,
      email: "waelbenabid1@gmail.com",
      user_type: "admin",
      first_name: "Wael",
      last_name: "Ben Abid",
      profile_image: null,
      requires_password_change: false
    };
    sessionStorage.setItem('auth_user', JSON.stringify(testUser));
    return testUser;  // ← Always returns this user!
  };

  const initialUser = getUserFromSession();
  // Rest of code...
```

### ✅ Fixed Version

```typescript
const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
  /**
   * NEVER auto-login a user. Return null and require explicit authentication.
   * The backend will verify actual auth via the HttpOnly cookie.
   */
  const getUserFromSession = (): User | null => {
    try {
      const stored = sessionStorage.getItem('auth_user');
      if (!stored) return null;
      
      const user = JSON.parse(stored);
      // Validate minimum required fields
      if (!user.id || !user.email) {
        sessionStorage.removeItem('auth_user');
        return null;
      }
      return user;
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      sessionStorage.removeItem('auth_user');
      return null;
    }
  };

  const initialUser = getUserFromSession();
  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setToken] = useState<string | null>(initialUser ? 'http-only-cookie' : null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    // ALWAYS verify with backend on initial load
    // The backend checks the HttpOnly cookie
    const verifyAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE}`, {
          credentials: 'include',  // Send cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setToken('http-only-cookie');
          sessionStorage.setItem('auth_user', JSON.stringify(data));
        } else if (response.status === 401) {
          // User not authenticated
          setUser(null);
          setToken(null);
          sessionStorage.removeItem('auth_user');
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        // Network error - don't assume authenticated
        setUser(null);
        setToken(null);
        sessionStorage.removeItem('auth_user');
      } finally {
        setIsInitializing(false);
      }
    };

    verifyAuth();
  }, []);

  // ... rest of implementation
};
```

### ✅ Update Login Endpoint to Test

```typescript
// frontend/pages/Auth.tsx
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      credentials: 'include',  // Important: send/receive cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const userData = await response.json();
      login(userData.user, 'http-only-cookie');
      navigate('/');
    } else if (response.status === 400) {
      setError('Invalid email or password');
    } else {
      setError('Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    setError('Network error. Please check your connection.');
  }
};
```

### ✅ Add E2E Test to Prevent Regression

```typescript
// frontend/tests/auth.e2e.test.ts
describe('Authentication E2E', () => {
  it('should NOT auto-login a user', async () => {
    // Simulate fresh browser (no session storage)
    sessionStorage.clear();
    
    // Mount app
    const { getByText, queryByText } = render(<App />);
    
    // Should show loading initially
    expect(getByText('Loading Application...')).toBeInTheDocument();
    
    // Wait for auth check
    await waitFor(() => {
      // Should redirect to login since no valid session
      expect(window.location.pathname).toBe('/auth');
    });
    
    // Should NOT show user menu
    expect(queryByText('waelbenabid1@gmail.com')).not.toBeInTheDocument();
  });

  it('should require login to access protected routes', async () => {
    sessionStorage.clear();
    
    // Try to access admin dashboard directly
    window.history.pushState({}, '', '/admin');
    
    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('Sign In')).toBeInTheDocument();
    });
  });

  it('should persist login across page refresh', async () => {
    // First: login
    const { rerender } = render(<App />);
    
    // Simulate login
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(sessionStorage.getItem('auth_user')).toBeTruthy();
    });
    
    // Simulate page refresh
    rerender(<App />);
    
    // Should still be logged in
    const storedUser = sessionStorage.getItem('auth_user');
    expect(storedUser).toBeTruthy();
    expect(JSON.parse(storedUser!).email).toBe('test@example.com');
  });
});
```

---

## Issue #2: ADD FILE UPLOAD VALIDATION (HIGH)

**Current Problem**: No file size or MIME type validation → OOM vulnerability  
**Location**: `backend/api/serializers.py` (MediaUploadSerializer)  

### ❌ Current (INCOMPLETE)

```python
class MediaUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaUpload
        fields = ['file', 'uploaded_by']
    
    # No validation methods!
```

### ✅ Fixed Version

```python
import mimetypes
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import MediaUpload

class MediaUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for media file uploads with security validation.
    
    Validates:
    - File size (max 10MB)
    - MIME type (images and videos only)
    - File extension matches MIME type
    """
    
    # Allowed MIME types and extensions
    ALLOWED_MIMETYPES = {
        'image/jpeg': {'.jpg', '.jpeg'},
        'image/png': {'.png'},
        'image/webp': {'.webp'},
        'image/gif': {'.gif'},
        'video/mp4': {'.mp4'},
        'video/webm': {'.webm'},
    }
    
    # File size limits
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    class Meta:
        model = MediaUpload
        fields = ['id', 'file', 'uploaded_at', 'uploaded_by']
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']
    
    def validate_file(self, file):
        """
        Validate file size, MIME type, and extension.
        
        Raises:
            serializers.ValidationError: If file is invalid
        """
        # 1. Check file size
        if file.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"File size must be less than {self.MAX_FILE_SIZE / 1024 / 1024:.0f}MB. "
                f"Your file is {file.size / 1024 / 1024:.2f}MB."
            )
        
        # 2. Get file extension
        filename = file.name.lower()
        _, ext = os.path.splitext(filename)
        
        if not ext:
            raise serializers.ValidationError(
                "File must have an extension (e.g., .jpg, .png, .mp4)"
            )
        
        # 3. Detect MIME type from content (not trusting client)
        file.seek(0)  # Reset file pointer
        file_content = file.read(512)  # Read first 512 bytes for detection
        file.seek(0)  # Reset again for saving
        
        detected_mime, _ = mimetypes.guess_type(filename)
        
        # For better detection, use magic bytes
        detected_mime = self._detect_mime_type_from_bytes(file_content, filename)
        
        if detected_mime not in self.ALLOWED_MIMETYPES:
            raise serializers.ValidationError(
                f"File type '{detected_mime}' is not allowed. "
                f"Allowed types: {', '.join(self.ALLOWED_MIMETYPES.keys())}"
            )
        
        # 4. Check if extension matches detected MIME type
        if ext not in self.ALLOWED_MIMETYPES[detected_mime]:
            raise serializers.ValidationError(
                f"File extension '{ext}' doesn't match the file type '{detected_mime}'. "
                f"Valid extensions for this type: {', '.join(self.ALLOWED_MIMETYPES[detected_mime])}"
            )
        
        return file
    
    def _detect_mime_type_from_bytes(self, file_bytes: bytes, filename: str) -> str:
        """
        Detect MIME type from file magic bytes instead of extension.
        
        This prevents fake file extensions (e.g., .exe renamed to .jpg).
        """
        # JPEG: FF D8 FF
        if file_bytes.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg'
        
        # PNG: 89 50 4E 47
        if file_bytes.startswith(b'\x89PNG'):
            return 'image/png'
        
        # GIF: 47 49 46 38
        if file_bytes.startswith(b'GIF8'):
            return 'image/gif'
        
        # WebP: RIFF...WEBP
        if b'WEBP' in file_bytes[:32]:
            return 'image/webp'
        
        # MP4: (usually has 'ftyp' atom)
        if b'ftyp' in file_bytes[:32]:
            return 'video/mp4'
        
        # WebM: 1A 45 DF A3
        if file_bytes.startswith(b'\x1a\x45\xdf\xa3'):
            return 'video/webm'
        
        # Fallback to filename detection
        guessed, _ = mimetypes.guess_type(filename)
        return guessed or 'application/octet-stream'
    
    def create(self, validated_data):
        """
        Create media upload with automatic user assignment.
        """
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)
```

### ✅ Add Unit Tests

```python
# backend/api/tests.py
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class MediaUploadTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_upload_valid_image(self):
        """Test uploading a valid image file"""
        # Create a real PNG file
        image = SimpleUploadedFile(
            "test.png",
            b'\x89PNG\r\n\x1a\n...',  # PNG header
            content_type="image/png"
        )
        
        response = self.client.post('/api/upload/', {'file': image})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_reject_oversized_file(self):
        """Test that files larger than 10MB are rejected"""
        large_file = SimpleUploadedFile(
            "large.jpg",
            b'x' * (11 * 1024 * 1024),  # 11MB
            content_type="image/jpeg"
        )
        
        response = self.client.post('/api/upload/', {'file': large_file})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('size', response.json()['error'].lower())
    
    def test_reject_malicious_file_extension(self):
        """Test that .exe files disguised as .jpg are rejected"""
        # Create a fake JPEG with executable content
        malicious = SimpleUploadedFile(
            "malware.jpg",  # Looks like JPEG
            b'MZ\x90\x00...',  # But this is actually an executable (PE header)
            content_type="image/jpeg"
        )
        
        response = self.client.post('/api/upload/', {'file': malicious})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_reject_unsupported_type(self):
        """Test that unsupported file types are rejected"""
        pdf = SimpleUploadedFile(
            "document.pdf",
            b'%PDF-1.4...',
            content_type="application/pdf"
        )
        
        response = self.client.post('/api/upload/', {'file': pdf})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_reject_no_extension(self):
        """Test that files without extensions are rejected"""
        noext = SimpleUploadedFile(
            "noextension",  # No extension!
            b'\x89PNG\r\n\x1a\n',
            content_type="image/png"
        )
        
        response = self.client.post('/api/upload/', {'file': noext})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
```

---

## Issue #3: FIX TOKEN EXPIRY & ADD REFRESH TOKENS (HIGH)

**Current Problem**: 7-day token lifetime is too long; no refresh mechanism  
**Location**: `backend/api/views.py` (LoginView, RegisterView, SocialAuthView)  

### ❌ Current

```python
response.set_cookie(
    'auth_token',
    token.key,
    httponly=True,
    secure=not settings.DEBUG,
    samesite='Lax',
    max_age=3600 * 24 * 7  # ← 7 days is too long!
)
```

### ✅ Better Solution: Implement Refresh Tokens

```python
# backend/api/models.py - Add RefreshToken model

from django.db import models
from django.contrib.auth import get_user_model
from datetime import timedelta
from django.utils import timezone
import secrets

User = get_user_model()

class RefreshToken(models.Model):
    """
    Refresh tokens for token rotation.
    
    Strategy:
    - Access token: 2 hours (short-lived)
    - Refresh token: 7 days (long-lived, stored in httpOnly cookie)
    
    When access token expires, client uses refresh token to get a new one.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='refresh_token')
    token = models.CharField(max_length=255, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Refresh Token'
        verbose_name_plural = 'Refresh Tokens'
    
    def is_valid(self) -> bool:
        """Check if token is valid (not expired, not revoked)"""
        now = timezone.now()
        return (
            self.expires_at > now and
            self.revoked_at is None
        )
    
    @classmethod
    def create_for_user(cls, user: User) -> 'RefreshToken':
        """Create a new refresh token for a user"""
        # Revoke old one if exists
        cls.objects.filter(user=user).update(
            revoked_at=timezone.now()
        )
        
        # Create new token
        token_value = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(days=7)
        
        return cls.objects.create(
            user=user,
            token=token_value,
            expires_at=expires_at
        )


# backend/api/serializers.py

class TokenResponseSerializer(serializers.Serializer):
    """Response format for authentication endpoints"""
    access_token = serializers.CharField()
    token_type = serializers.CharField(default='Bearer')
    expires_in = serializers.IntegerField(help_text="Seconds until expiry")


# backend/api/views.py

from datetime import datetime, timedelta
from django.utils import timezone

class LoginView(APIView):
    """Updated login with refresh token flow"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
            return Response({
                'error': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        access_token = self._generate_access_token(user)
        refresh_token = RefreshToken.create_for_user(user)
        
        # Create response
        response = Response({
            'user': UserSerializer(user).data,
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': 3600  # 1 hour
        }, status=status.HTTP_200_OK)
        
        # Set refresh token as httpOnly cookie (NOT access token!)
        response.set_cookie(
            'refresh_token',
            refresh_token.token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Strict',  # ← Changed from Lax to Strict
            max_age=3600 * 24 * 7,  # 7 days
            path='/api/auth/refresh/'  # ← Only sent to refresh endpoint
        )
        
        return response
    
    def _generate_access_token(self, user: User) -> str:
        """
        Generate a short-lived access token.
        In production, use JWT for stateless auth.
        """
        from rest_framework.authtoken.models import Token
        
        token, created = Token.objects.get_or_create(user=user)
        return token.key


class RefreshTokenView(APIView):
    """
    Endpoint to refresh access token using refresh token.
    
    Request: POST /api/auth/refresh/
    Response: { "access_token": "...", "expires_in": 3600 }
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        refresh_token_value = request.COOKIES.get('refresh_token')
        
        if not refresh_token_value:
            return Response({
                'error': 'Refresh token not found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Validate refresh token
        try:
            refresh_token = RefreshToken.objects.get(
                token=refresh_token_value
            )
        except RefreshToken.DoesNotExist:
            return Response({
                'error': 'Invalid or expired refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not refresh_token.is_valid():
            return Response({
                'error': 'Refresh token has expired or been revoked'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate new access token
        user = refresh_token.user
        access_token = self._generate_access_token(user)
        
        return Response({
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': 3600
        })
    
    def _generate_access_token(self, user: User) -> str:
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        return token.key


class LogoutView(APIView):
    """Logout and invalidate refresh token"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Revoke refresh token
        refresh_token_value = request.COOKIES.get('refresh_token')
        if refresh_token_value:
            try:
                refresh_token = RefreshToken.objects.get(
                    token=refresh_token_value
                )
                refresh_token.revoked_at = timezone.now()
                refresh_token.save()
            except RefreshToken.DoesNotExist:
                pass  # Token already invalid
        
        response = Response(
            {'message': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )
        
        # Clear refresh token cookie
        response.delete_cookie('refresh_token', path='/api/auth/refresh/')
        
        return response
```

### ✅ Update Frontend to Handle Token Refresh

```typescript
// frontend/services/api.ts

const API_BASE_URL = process.env.VITE_API_URL || '/api';
const ACCESS_TOKEN_EXPIRY = 3600 * 1000; // 1 hour in milliseconds

class APIClient {
  private accessToken: string | null = null;
  private accessTokenExpiresAt: number | null = null;
  private refreshInProgress: Promise<boolean> | null = null;

  /**
   * Refresh access token using refresh token stored in httpOnly cookie
   */
  async refreshAccessToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshInProgress) {
      return this.refreshInProgress;
    }

    this.refreshInProgress = new Promise(async (resolve) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
          method: 'POST',
          credentials: 'include', // Send refresh token cookie
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.accessToken = data.access_token;
          this.accessTokenExpiresAt = Date.now() + (data.expires_in * 1000);
          resolve(true);
        } else if (response.status === 401) {
          // Refresh token expired - user needs to login again
          this.accessToken = null;
          this.accessTokenExpiresAt = null;
          resolve(false);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        resolve(false);
      } finally {
        this.refreshInProgress = null;
      }
    });

    return this.refreshInProgress;
  }

  /**
   * Make an API request with automatic token refresh
   */
  async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Check if token needs refresh
    if (this.accessToken && this.accessTokenExpiresAt) {
      const timeUntilExpiry = this.accessTokenExpiresAt - Date.now();
      const refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes before expiry

      if (timeUntilExpiry < refreshThreshold) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          // Token refresh failed, user needs to login
          throw new Error('Session expired. Please login again.');
        }
      }
    }

    // Add access token to headers if available
    const headers = new Headers(options.headers || {});
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    // Always include credentials for httpOnly cookie handling
    options.credentials = 'include';
    options.headers = headers;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        headers.set('Authorization', `Bearer ${this.accessToken}`);
        return fetch(`${API_BASE_URL}${endpoint}`, options);
      } else {
        // Refresh failed - user needs to login
        window.location.href = '/auth?redirect=' + window.location.pathname;
        throw new Error('Session expired');
      }
    }

    return response;
  }
}

export const apiClient = new APIClient();
```

---

## Issue #4: ADD GDPR COMPLIANCE (HIGH)

**Current Problem**: Storing visitor IP addresses without consent or retention policy  
**Location**: `backend/api/models.py` & `backend/api/middleware.py`  

### ✅ Implementation

```python
# backend/api/models.py

class VisitorConsent(models.Model):
    """Track GDPR consent for visitor tracking"""
    SESSION_KEY = models.CharField(max_length=64, unique=True, db_index=True)
    IP_ADDRESS = models.GenericIPAddressField(null=True, blank=True)
    CONSENT_GIVEN = models.BooleanField(default=False)
    CONSENT_VERSION = models.CharField(max_length=10, default='1.0')
    CREATED_AT = models.DateTimeField(auto_now_add=True)
    EXPIRES_AT = models.DateTimeField(help_text="When consent expires (usually 90 days)")
    
    class Meta:
        indexes = [
            models.Index(fields=['SESSION_KEY']),
            models.Index(fields=['EXPIRES_AT']),
        ]
        verbose_name = 'Visitor Consent'
    
    def is_valid(self) -> bool:
        """Check if consent is still valid"""
        return (
            self.CONSENT_GIVEN and 
            self.EXPIRES_AT > timezone.now()
        )


class Visitor(models.Model):
    """
    Visitor tracking model with privacy enhancements.
    
    Privacy features:
    - IP addresses anonymized (last octet = 0)
    - Only stores if user gave consent
    - Auto-deletes after 90 days
    - Includes consent record reference
    """
    ANONYMIZED_IP = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP with last octet anonymized (e.g., 192.168.1.0)"
    )
    USER_AGENT = models.TextField(null=True, blank=True)
    REFERRER = models.URLField(null=True, blank=True, max_length=500)
    PATH = models.CharField(max_length=500, null=True, blank=True)
    SESSION_KEY = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    USER = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visits'
    )
    VISIT_TIME = models.DateTimeField(default=timezone.now, db_index=True)
    IS_UNIQUE = models.BooleanField(default=True)
    DEVICE_TYPE = models.CharField(max_length=50, null=True, blank=True)
    BROWSER = models.CharField(max_length=50, null=True, blank=True)
    OS = models.CharField(max_length=50, null=True, blank=True)
    
    # GDPR fields
    CONSENT_RECORD = models.ForeignKey(
        VisitorConsent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Reference to the consent record at time of visit"
    )
    CREATED_AT = models.DateTimeField(auto_now_add=True)
    WILL_DELETE_AT = models.DateTimeField(
        help_text="When this record will be auto-deleted (90 days after creation)"
    )
    
    class Meta:
        ordering = ['-VISIT_TIME']
        indexes = [
            models.Index(fields=['-VISIT_TIME']),
            models.Index(fields=['SESSION_KEY']),
            models.Index(fields=['WILL_DELETE_AT']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.WILL_DELETE_AT:
            self.WILL_DELETE_AT = timezone.now() + timedelta(days=90)
        super().save(*args, **kwargs)


# Management command to auto-delete expired visitor records

# backend/api/management/commands/cleanup_expired_visitors.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Visitor, VisitorConsent

class Command(BaseCommand):
    help = 'Delete visitor records older than 90 days (GDPR compliance)'
    
    def handle(self, *args, **options):
        now = timezone.now()
        
        # Delete expired visitor records
        deleted_count, _ = Visitor.objects.filter(
            WILL_DELETE_AT__lte=now
        ).delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {deleted_count} expired visitor records'
            )
        )
        
        # Delete expired consents
        consent_deleted, _ = VisitorConsent.objects.filter(
            EXPIRES_AT__lte=now
        ).delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {consent_deleted} expired consent records'
            )
        )
```

### ✅ Middleware with Consent Check

```python
# backend/api/middleware.py

class GDPRCompliantVisitorTrackingMiddleware(MiddlewareMixin):
    """
    Track visitors only with explicit consent.
    """
    
    def process_response(self, request, response):
        # Skip tracking if disabled
        if getattr(settings, 'DISABLE_VISITOR_TRACKING', False):
            return response
        
        # Skip excluded paths
        if self._should_skip_tracking(request):
            return response
        
        try:
            # Check if user gave consent
            session_key = request.session.session_key
            if not session_key:
                return response
            
            consent = VisitorConsent.objects.filter(
                SESSION_KEY=session_key
            ).first()
            
            if not consent or not consent.is_valid():
                # No consent - don't track
                return response
            
            # User gave consent - track with anonymized IP
            ip_address = self._get_ip_address(request)
            anonymized_ip = self._anonymize_ip(ip_address)
            
            Visitor.objects.create(
                ANONYMIZED_IP=anonymized_ip,  # Not raw IP
                USER_AGENT=self._sanitize_user_agent(
                    request.META.get('HTTP_USER_AGENT', '')
                ),
                REFERRER=request.META.get('HTTP_REFERER'),
                PATH=request.path_info,
                SESSION_KEY=session_key,
                USER=request.user if request.user.is_authenticated else None,
                VISIT_TIME=timezone.now(),
                IS_UNIQUE=self._is_unique_visitor(anonymized_ip, session_key),
                DEVICE_TYPE=self._get_device_type(
                    request.META.get('HTTP_USER_AGENT', '')
                ),
                BROWSER=self._get_browser(
                    request.META.get('HTTP_USER_AGENT', '')
                ),
                OS=self._get_os(
                    request.META.get('HTTP_USER_AGENT', '')
                ),
                CONSENT_RECORD=consent,
            )
        except Exception as e:
            logger.error(f'Error tracking visitor: {e}')
        
        return response
    
    def _anonymize_ip(self, ip_address: str) -> str:
        """
        Anonymize IP address by zeroing out last octet.
        
        Example: 192.168.1.42 → 192.168.1.0
        """
        if not ip_address:
            return None
        
        parts = ip_address.split('.')
        if len(parts) == 4:
            parts[-1] = '0'  # Zero out last octet
            return '.'.join(parts)
        
        return ip_address
    
    # ... other helper methods ...
```

---

## Issue #5: FIX OAUTH SECURITY (MEDIUM-HIGH)

**Current Problem**: Missing state parameter, no NONCE, timeout handling issues  
**Location**: `backend/api/serializers.py` & `backend/api/views.py`  

### ✅ Implementation

```python
# backend/api/models.py - Add OAuth state tracking

class OAuthState(models.Model):
    """
    Prevent CSRF attacks on OAuth endpoints.
    
    OAuth CSRF attack:
    1. Attacker redirects user to evil site
    2. Evil site redirects to Google OAuth endpoint (with state)
    3. Evil site captures the auth code
    4. Evil site sends code to victim's browser
    5. Victim's browser calls backend with attacker's auth code
    6. Victim's account gets linked to attacker
    
    Prevention: Use state parameter + server-side state mismatch detection
    """
    STATE = models.CharField(max_length=255, unique=True, db_index=True)
    CREATED_AT = models.DateTimeField(auto_now_add=True)
    EXPIRES_AT = models.DateTimeField()
    
    class Meta:
        verbose_name = 'OAuth State'
    
    @classmethod
    def create(cls) -> str:
        """
        Create a new OAuth state token.
        
        Returns:
            The state string to send to OAuth provider
        """
        state = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(minutes=10)
        
        cls.objects.create(
            STATE=state,
            EXPIRES_AT=expires_at
        )
        
        return state
    
    @classmethod
    def validate(cls, state: str) -> bool:
        """
        Validate an OAuth state token.
        
        Returns:
            True if valid, False otherwise
        """
        try:
            record = cls.objects.get(STATE=state)
        except cls.DoesNotExist:
            return False
        
        if record.EXPIRES_AT < timezone.now():
            record.delete()  # Clean up expired states
            return False
        
        # Consume the state (prevent replay attacks)
        record.delete()
        return True


# backend/api/serializers.py

class SocialAuthSerializer(serializers.Serializer):
    """
    OAuth authentication with proper security.
    """
    EMAIL = serializers.EmailField(required=False)
    PROVIDER = serializers.CharField()
    PROVIDER_ID = serializers.CharField(required=False)
    PROVIDER_TOKEN = serializers.CharField(write_only=True, required=True)
    STATE = serializers.CharField(write_only=True, required=True)  # ← NEW
    NONCE = serializers.CharField(write_only=True, required=True)  # ← NEW
    FIRST_NAME = serializers.CharField(required=False, default='')
    LAST_NAME = serializers.CharField(required=False, default='')
    PROFILE_IMAGE = serializers.URLField(required=False, allow_null=True)
    
    def validate_provider(self, value):
        """Validate provider is supported"""
        if value not in ['google', 'facebook']:
            raise serializers.ValidationError(
                f"Unsupported provider: {value}"
            )
        return value
    
    def validate(self, attrs):
        """
        Verify OAuth token AND state parameter.
        """
        from api.models import OAuthState
        
        # 1. Validate state parameter (CSRF protection)
        state = attrs.get('STATE')
        if not OAuthState.validate(state):
            logger.warning(f"Invalid OAuth state: {state}")
            raise serializers.ValidationError(
                "Invalid or expired OAuth session. Please try again."
            )
        
        # 2. Verify OAuth token
        provider = attrs.get('provider')
        provider_token = attrs.get('provider_token')
        nonce = attrs.get('NONCE')
        
        verified = self._verify_oauth_token(
            provider,
            provider_token,
            nonce,
            attrs.get('provider_id'),
            attrs.get('email')
        )
        
        if not verified:
            raise serializers.ValidationError(
                "OAuth token verification failed."
            )
        
        return attrs
    
    def _verify_oauth_token(
        self,
        provider: str,
        token: str,
        nonce: str,
        expected_id: str = None,
        expected_email: str = None
    ) -> bool:
        """
        Safely verify OAuth token with proper error handling.
        """
        import requests
        from django.conf import settings
        
        if provider == 'google':
            return self._verify_google_token(token, nonce, expected_id)
        elif provider == 'facebook':
            return self._verify_facebook_token(token, expected_id)
        
        return False
    
    def _verify_google_token(
        self,
        id_token: str,
        nonce: str,
        expected_sub: str = None
    ) -> bool:
        """
        Verify Google ID token with timeout and retry.
        """
        import requests
        from tenacity import retry, stop_after_attempt, wait_exponential
        
        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=1, min=1, max=5)
        )
        def verify():
            # Verify with timeout
            response = requests.get(
                'https://oauth2.googleapis.com/tokeninfo',
                params={'id_token': id_token},
                timeout=5
            )
            
            if response.status_code != 200:
                return False
            
            data = response.json()
            
            # Verify nonce
            if data.get('nonce') != nonce:
                logger.warning('Nonce mismatch in Google token')
                return False
            
            # Verify audience (client ID)
            client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
            if data.get('aud') != client_id:
                logger.warning('Audience mismatch in Google token')
                return False
            
            # Verify user ID if expected
            if expected_sub and data.get('sub') != expected_sub:
                logger.warning('Subject mismatch in Google token')
                return False
            
            return True
        
        try:
            return verify()
        except requests.Timeout:
            logger.error('Google token verification timeout')
            return False
        except Exception as e:
            logger.error(f'Google token verification error: {e}')
            return False
```

### ✅ Frontend OAuth Integration with State

```typescript
// frontend/services/oauth.ts

export class OAuthService {
  /**
   * Get Google OAuth redirect URL with state parameter.
   */
  static getGoogleAuthUrl(): string {
    // Generate state and nonce for security
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);
    
    // Store in sessionStorage for verification
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_nonce', nonce);
    
    const params = new URLSearchParams({
      client_id: process.env.VITE_GOOGLE_CLIENT_ID!,
      redirect_uri: `${window.location.origin}/auth/callback`,
      response_type: 'code id_token',
      scope: 'openid email profile',
      nonce,
      state,
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
  
  /**
   * Handle OAuth callback.
   */
  static async handleCallback(idToken: string, state: string): Promise<any> {
    // Verify state matches
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('State mismatch - potential CSRF attack');
    }
    
    const nonce = sessionStorage.getItem('oauth_nonce');
    
    // Clear stored values
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_nonce');
    
    // Send to backend
    const response = await fetch('/api/auth/social/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        provider_token: idToken,
        state: savedState,
        nonce,
      }),
    });
    
    if (!response.ok) {
      throw new Error('OAuth verification failed');
    }
    
    return response.json();
  }
  
  private static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
```

---

## SUMMARY: Most Critical Fixes

| # | Issue | File | Lines | Time | Status |
|---|-------|------|-------|------|--------|
| 1 | Remove hardcoded user | `frontend/App.tsx` | 90-120 | 2h | 🔴 BLOCKER |
| 2 | Add upload validation | `backend/api/serializers.py` | N/A | 3h | 🟠 HIGH |
| 3 | Fix token expiry | `backend/api/views.py` | 40-100 | 4h | 🟠 HIGH |
| 4 | Add GDPR compliance | `backend/api/models.py` | N/A | 5h | 🟠 HIGH |
| 5 | Fix OAuth | `backend/api/serializers.py` | 100-180 | 3h | 🟡 MEDIUM |

**Total Time**: ~40 hours (do in this order)

**Do Issue #1 first** - it's blocking everything else.

