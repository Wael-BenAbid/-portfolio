"""
Custom authentication class to support HttpOnly cookie token authentication
"""
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware


class CookieTokenAuthentication(TokenAuthentication):
    """
    Authentication class that extracts token from:
    1. HttpOnly cookie (same-origin)
    2. Authorization: Bearer <token> header (cross-origin)
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        # 1. Try HttpOnly cookie first (same-origin deployments)
        token = request.COOKIES.get('auth_token')
        if token:
            try:
                return self.authenticate_credentials(token)
            except Exception:
                pass

        # 2. Fall back to Authorization header (cross-origin deployments)
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0] in ('Bearer', 'Token'):
                try:
                    return self.authenticate_credentials(parts[1])
                except Exception:
                    pass

        return None


# Add this to REST_FRAMEWORK in settings.py:
# 'DEFAULT_AUTHENTICATION_CLASSES': [
#     'api.authentication.CookieTokenAuthentication',
#     'rest_framework.authentication.SessionAuthentication',
#     'rest_framework.authentication.TokenAuthentication',
# ],

