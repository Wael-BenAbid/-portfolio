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
