import logging
import os
import sys
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
ROOT_DIR = BASE_DIR.parent

# Load env from project root first, then backend/.env (override=True so
# backend-specific settings take precedence over root docker-compose defaults)
load_dotenv(ROOT_DIR / '.env')
load_dotenv(BASE_DIR / '.env', override=True)

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'change-me-in-production')
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv(
        'DJANGO_ALLOWED_HOSTS',
        'localhost,127.0.0.1,0.0.0.0,wael-ben-abid.me,www.wael-ben-abid.me',
    ).split(',')
    if h.strip()
]

APPEND_SLASH = False

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'cloudinary_storage',
    'cloudinary',
    'rest_framework',
    'drf_spectacular',
    'rest_framework.authtoken',
    'corsheaders',
    'api',
    'projects',
    'cv',
    'content',
    'interactions',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.MaliciousActivityDetectionMiddleware',
    'api.middleware.SecurityHeadersMiddleware',
    'api.middleware.PrometheusMetricsMiddleware',
    'api.middleware.ActivityLoggingMiddleware',
    'api.middleware.VisitorTrackingMiddleware',
]

ROOT_URLCONF = 'portfolio.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'portfolio.wsgi.application'
ASGI_APPLICATION = 'portfolio.asgi.application'
AUTH_USER_MODEL = 'api.CustomUser'

DATABASES = {
    'default': dj_database_url.parse(
        os.getenv('DATABASE_URL', 'postgres://postgres:12345@localhost:5433/portfolio_db'),
        conn_max_age=600,
        ssl_require=os.getenv('DB_SSL_REQUIRE', 'False').lower() == 'true',
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cloudinary configuration for persistent file storage (Render has ephemeral disk)
if os.getenv('CLOUDINARY_CLOUD_NAME'):
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
        'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
        'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
    }
    DEFAULT_FILE_STORAGE = 'api.storage.AutoCloudinaryStorage'

DATA_UPLOAD_MAX_MEMORY_SIZE = 115343360  # 110MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 115343360  # 110MB
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Optional: serve React build from Django
SERVE_FRONTEND_FROM_DJANGO = os.getenv('SERVE_FRONTEND_FROM_DJANGO', 'False').lower() == 'true'
if SERVE_FRONTEND_FROM_DJANGO:
    STATICFILES_DIRS = [ROOT_DIR / 'frontend' / 'dist']

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,http://localhost:3002,https://wael-ben-abid.me,https://www.wael-ben-abid.me',
    ).split(',')
    if o.strip()
]

CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:3000,http://localhost:3002,https://wael-ben-abid.me,https://www.wael-ben-abid.me',
    ).split(',')
    if o.strip()
]

SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.CookieTokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticatedOrReadOnly'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {'anon': '1000/hour', 'user': '5000/hour'},
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'api.error_handling.api_exception_handler',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Portfolio API',
    'DESCRIPTION': 'Portfolio API (Django + DRF)',
    'VERSION': '1.0.0',
    'SCHEMA_PATH_PREFIX': '/api/',
}

REDIS_URL = os.getenv('REDIS_URL', '')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
            'TIMEOUT': 300,
        }
    }
else:
    CACHES = {
        'default': {
            # Use LocMem as a safe fallback when Redis is not configured.
            # DummyCache can break features that require cache increments (e.g. rate limiting).
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'portfolio-cache',
        }
    }

GOOGLE_OAUTH2_CLIENT_ID = os.getenv('GOOGLE_OAUTH2_CLIENT_ID', '')
GOOGLE_OAUTH2_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH2_CLIENT_SECRET', '')
FACEBOOK_APP_ID = os.getenv('FACEBOOK_APP_ID', '')
FACEBOOK_APP_SECRET = os.getenv('FACEBOOK_APP_SECRET', '')

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@wael-ben-abid.me')

LOG_LEVEL = os.getenv('DJANGO_LOG_LEVEL', 'INFO')
os.makedirs(BASE_DIR / 'logs', exist_ok=True)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {'format': '%(levelname)s %(message)s'},
        'verbose': {'format': '%(levelname)s %(asctime)s %(name)s %(message)s'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'simple'},
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(BASE_DIR / 'logs' / 'django.log'),
            'maxBytes': 10 * 1024 * 1024,
            'backupCount': 5,
            'formatter': 'verbose',
            'delay': True,  # Delay opening the file until first write - helps with Windows file locking
        },
    },
    'loggers': {
        'django': {'handlers': ['console', 'file'], 'level': LOG_LEVEL, 'propagate': False},
        'security': {'handlers': ['console', 'file'], 'level': 'WARNING', 'propagate': False},
    },
}

# Health endpoint-related defaults
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Token/refresh timings used by app
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
