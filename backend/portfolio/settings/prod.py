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
# Always allow the production frontend domains, regardless of env vars
# This ensures CORS works even if environment variables aren't configured
CORS_ALLOWED_ORIGINS = [
    'https://wael-ben-abid.me',
    'https://www.wael-ben-abid.me',
    'http://localhost:3000',      # Local development
    'http://localhost:5173',      # Vite dev server
]

# Add any additional origins from environment variable (comma-separated)
_cors_env = os.getenv('CORS_ALLOWED_ORIGINS', '').strip()
if _cors_env:
    extra_origins = [o.strip() for o in _cors_env.split(',') if o.strip()]
    CORS_ALLOWED_ORIGINS.extend(extra_origins)

# Always enable credentials for CORS (required for auth cookies)
CORS_ALLOW_CREDENTIALS = True

# Allow these HTTP methods for CORS
CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD'
]

# Allow these headers in CORS requests
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CSRF Trusted Origins for cross-origin form submissions
# Need to include both frontend origins and backend origin for proper CSRF protection
CSRF_TRUSTED_ORIGINS = [
    'https://wael-ben-abid.me',
    'https://www.wael-ben-abid.me',
    'https://portfolio-4kcq.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
]

# Add any additional CSRF origins from environment variable
_csrf_env = os.getenv('CSRF_TRUSTED_ORIGINS', '').strip()
if _csrf_env:
    extra_csrf = [o.strip() for o in _csrf_env.split(',') if o.strip()]
    CSRF_TRUSTED_ORIGINS.extend(extra_csrf)

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
