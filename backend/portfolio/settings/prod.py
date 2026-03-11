from .base import *

DEBUG = False

if SECRET_KEY == 'change-me-in-production':
    raise ValueError('DJANGO_SECRET_KEY must be set in production.')

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() == 'true'
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

CORS_ALLOW_ALL_ORIGINS = False

# Enforce production hosts for the reserved domain and backend host.
ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv(
        'DJANGO_ALLOWED_HOSTS',
        'wael-ben-abid.me,www.wael-ben-abid.me,api.wael-ben-abid.me,.onrender.com',
    ).split(',')
    if h.strip()
]
