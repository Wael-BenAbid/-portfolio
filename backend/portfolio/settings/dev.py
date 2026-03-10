from .base import *

DEBUG = True

SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_SSL_REDIRECT = False

# Easier local origins while developing.
CORS_ALLOW_ALL_ORIGINS = True
