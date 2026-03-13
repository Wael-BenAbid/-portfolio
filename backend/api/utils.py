"""
Utility functions for encrypting and decrypting sensitive data
"""
import logging
from functools import wraps

from cryptography.fernet import Fernet
from django.conf import settings


logger = logging.getLogger(__name__)


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
    try:
        from django_ratelimit.decorators import ratelimit as django_ratelimit
    except Exception:
        # Fail open when ratelimit dependency is unavailable in runtime.
        def no_op_decorator(func):
            return func
        return no_op_decorator
    
    # In development mode, bypass rate limiting
    if settings.DEBUG:
        # Return a no-op decorator
        def no_op_decorator(func):
            return func
        return no_op_decorator
    
    # In production, use actual rate limiting with a safe fallback.
    def decorator(func):
        decorated = django_ratelimit(key=key, rate=rate, method=method, block=block)(func)

        @wraps(func)
        def wrapped(*args, **kwargs):
            try:
                return decorated(*args, **kwargs)
            except Exception as exc:
                logger.error("Rate limit backend failed, bypassing check: %s", exc, exc_info=True)
                return func(*args, **kwargs)

        return wrapped

    return decorator
