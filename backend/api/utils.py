"""
Utility functions for encrypting and decrypting sensitive data
"""
from cryptography.fernet import Fernet
from django.conf import settings


def get_fernet():
    """Get Fernet instance using secret key from settings"""
    secret_key = settings.SECRET_KEY.encode('utf-8')
    # Fernet requires a 32-byte key, so we'll hash the secret key
    from hashlib import sha256
    key = sha256(secret_key).digest()
    return Fernet(key[:32])


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
