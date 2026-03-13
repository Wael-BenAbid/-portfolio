"""
Utility functions for encrypting and decrypting sensitive data
"""
from cryptography.fernet import Fernet
from django.conf import settings


def get_fernet():
    """Get Fernet instance using secret key from settings"""
    secret_key = settings.SECRET_KEY.encode('utf-8')
    # Fernet requires a 32-byte url-safe base64-encoded key
    from hashlib import sha256
    import base64
    key = sha256(secret_key).digest()
    # Base64 encode the key to make it compatible with Fernet
    url_safe_key = base64.urlsafe_b64encode(key)
    return Fernet(url_safe_key)


def encrypt(value):
    """Encrypt a string value"""
    if not value:
        return value
    fernet = get_fernet()
    return fernet.encrypt(value.encode('utf-8')).decode('utf-8')


def decrypt(value):
    """Decrypt an encrypted string value"""
    if not value:
        return value
    fernet = get_fernet()
    return fernet.decrypt(value.encode('utf-8')).decode('utf-8')


# ============= Rate Limiting Utilities =============

def ratelimit_or_exempt(key, rate, method=None, block=True):
    """
    Wrapper around django-ratelimit decorator that disables rate limiting in DEBUG mode.
    
    Useful for development where you want to test without hitting rate limits.
    
    Usage:
        @method_decorator(ratelimit_or_exempt(key='user', rate='100/h', method='POST'), name='dispatch')
        class MyView(APIView):
            pass
    """
    from django_ratelimit.decorators import ratelimit as django_ratelimit
    
    # In development mode, bypass rate limiting
    if settings.DEBUG:
        # Return a no-op decorator
        def no_op_decorator(func):
            return func
        return no_op_decorator
    
    # In production, use actual rate limiting
    return django_ratelimit(key=key, rate=rate, method=method, block=block)
