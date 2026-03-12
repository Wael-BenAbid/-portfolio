from .base import *

DEBUG = False

if SECRET_KEY == 'change-me-in-production':
    raise ValueError('DJANGO_SECRET_KEY must be set in production.')

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# Cross-origin deployment (Vercel frontend + Render backend on different domains):
# SameSite=None is required for cookies to be sent in cross-origin requests.
# Secure=True (set above) is mandatory when SameSite=None.
SESSION_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SAMESITE = 'None'
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() == 'true'
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

CORS_ALLOW_ALL_ORIGINS = False

# CORS Configuration for cross-origin requests (Frontend on Vercel, Backend on Render)
# Read from environment variable if set, otherwise use production defaults
_cors_origins = os.getenv('CORS_ALLOWED_ORIGINS', '').strip()
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]
else:
    # Fallback to production domains if env var not set
    CORS_ALLOWED_ORIGINS = [
        'https://wael-ben-abid.me',
        'https://www.wael-ben-abid.me',
    ]

# Always enable credentials for CORS (required for auth cookies)
CORS_ALLOW_CREDENTIALS = True

# CSRF Trusted Origins for cross-origin form submissions
# Need to include both frontend origins and backend origin for proper CSRF protection
_csrf_origins = os.getenv('CSRF_TRUSTED_ORIGINS', '').strip()
if _csrf_origins:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(',') if o.strip()]
else:
    # Fallback to production domains if env var not set
    CSRF_TRUSTED_ORIGINS = [
        'https://wael-ben-abid.me',
        'https://www.wael-ben-abid.me',
        'https://portfolio-4kcq.onrender.com',
    ]

# Enforce production hosts for the reserved domain and backend host.
_env_hosts = [
    h.strip()
    for h in os.getenv(
        'DJANGO_ALLOWED_HOSTS',
        'wael-ben-abid.me,www.wael-ben-abid.me,api.wael-ben-abid.me',
    ).split(',')
    if h.strip()
]
# Always allow .onrender.com for Render deployments
if '.onrender.com' not in _env_hosts:
    _env_hosts.append('.onrender.com')
ALLOWED_HOSTS = _env_hosts
