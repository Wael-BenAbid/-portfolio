"""
Custom authentication class to support HttpOnly cookie token authentication
"""
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware


class CookieTokenAuthentication(TokenAuthentication):
    """
    Authentication class that extracts token from HttpOnly cookie
    instead of Authorization header
    """
    def authenticate(self, request):
        # Try to get token from HttpOnly cookie
        token = request.COOKIES.get('auth_token')
        
        if not token:
            return None
            
        try:
            # Call TokenAuthentication's authenticate_credentials with the raw token string
            return self.authenticate_credentials(token)
        except Exception:
            # Token is invalid or expired — treat as anonymous so that public
            # endpoints (AllowAny) remain accessible.  Protected endpoints will
            # still return 401 because IsAuthenticated rejects anonymous users.
            return None


# Add this to REST_FRAMEWORK in settings.py:
# 'DEFAULT_AUTHENTICATION_CLASSES': [
#     'api.authentication.CookieTokenAuthentication',
#     'rest_framework.authentication.SessionAuthentication',
#     'rest_framework.authentication.TokenAuthentication',
# ],

