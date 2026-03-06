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
            
        # Check CSRF token for unsafe HTTP methods
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            csrf_token = request.COOKIES.get('csrftoken')
            if not csrf_token:
                raise AuthenticationFailed('CSRF token required')
                
            # Verify CSRF token
            try:
                CsrfViewMiddleware().process_view(request, None, (), {})
            except Exception as e:
                raise AuthenticationFailed('Invalid CSRF token') from e
                
        try:
            # Call TokenAuthentication's authenticate_credentials with the raw token string
            return self.authenticate_credentials(token)
        except Exception as e:
            raise AuthenticationFailed('Invalid or expired token') from e


# Add this to REST_FRAMEWORK in settings.py:
# 'DEFAULT_AUTHENTICATION_CLASSES': [
#     'api.authentication.CookieTokenAuthentication',
#     'rest_framework.authentication.SessionAuthentication',
#     'rest_framework.authentication.TokenAuthentication',
# ],
