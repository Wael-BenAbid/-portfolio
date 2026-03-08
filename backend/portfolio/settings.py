"""
Django settings for portfolio project.
"""
import sys
import logging
from pathlib import Path
import os
from datetime import timedelta
import json
from dotenv import load_dotenv

# Try to import optional packages
try:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    HAS_SENTRY = True
except ImportError:
    HAS_SENTRY = False

# Configure Sentry for error tracking (optional)
SENTRY_DSN = os.environ.get('SENTRY_DSN')
if HAS_SENTRY and SENTRY_DSN and not ('test' in sys.argv):
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
        ],
        traces_sample_rate=0.1,  # Sample 10% of transactions
        send_default_pii=False,  # Don't send personally identifiable information
        traces_sampler=lambda sampling_context: (
            0.0 if sampling_context["transaction_name"].startswith("/health") else 0.1
        )
    )

# Configure basic logging for settings module
logger = logging.getLogger(__name__)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
# Try loading from multiple locations for flexibility
env_loaded = False
for env_path in [BASE_DIR.parent / '.env', BASE_DIR / '.env', Path('.env')]:
    if env_path.exists():
        load_dotenv(env_path)
        env_loaded = True
        break
if not env_loaded:
    load_dotenv()  # Fallback to default behavior

# ===========================================
# SECURITY SETTINGS
# ===========================================

# SECRET_KEY - Required, no default for security
# DEBUG - Default to False for security
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'
if DEBUG:
    logger.warning("DEBUG mode is ON. This should be OFF in production!")

# SECRET_KEY - Required, no default for security
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    if 'test' in sys.argv:
        # Use a static secret key for testing only
        SECRET_KEY = 'test-secret-key-for-testing-only'
    else:
        raise ValueError("DJANGO_SECRET_KEY environment variable is required")

# ALLOWED_HOSTS - Required in production
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,backend').split(',')

# CSRF Configuration
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001').split(',')

# Session Configuration
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'

# ===========================================
# CACHING SETTINGS
# ===========================================

# Environment-based cache configuration
REDIS_URL = os.environ.get('REDIS_URL', '')

# Configure cache backend based on environment
# Priority: LocMemCache (development) -> Redis (production) -> DummyCache (fallback)
def _get_cache_backend():
    """
    Get the appropriate cache backend based on environment and Redis availability.
    Returns a CACHES dictionary configuration.
    """
    # For local development (DEBUG=True), always use LocMemCache to avoid Redis dependency
    if DEBUG:
        logger.info("DEBUG mode enabled. Using LocMemCache for development.")
        return {
            'default': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                'LOCATION': 'unique-snowflake',
                'OPTIONS': {
                    'MAX_ENTRIES': 1000,
                }
            }
        }
    
    if not REDIS_URL:
        # No Redis URL configured in production - use DummyCache
        logger.warning("No REDIS_URL configured in production. Using DummyCache.")
        return {
            'default': {
                'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
            }
        }
    
    # Try to use Redis for production environments
    try:
        import django_redis
        # Test Redis connection by attempting to import and configure
        CACHES = {
            'default': {
                'BACKEND': 'django_redis.cache.RedisCache',
                'LOCATION': REDIS_URL,
                'OPTIONS': {
                    'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                    'CONNECTION_POOL_KWARGS': {
                        'max_connections': 50,
                        'retry_on_timeout': True,
                    },
                    'SOCKET_CONNECT_TIMEOUT': 5,
                    'SOCKET_TIMEOUT': 5,
                },
                'KEY_PREFIX': 'portfolio',
                'TIMEOUT': 300,  # 5 minutes default
            }
        }
        logger.info(f"Cache backend set to Redis at {REDIS_URL}")
        return CACHES
    except ImportError:
        # django-redis not installed, fall back to DummyCache
        logger.warning(
            'REDIS_URL is set but django-redis is not installed. '
            'Falling back to DummyCache for production.'
        )
        return {
            'default': {
                'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
            }
        }
    except Exception as e:
        # Redis connection failed or other error, fall back to DummyCache
        logger.warning(
            f'Redis connection failed: {e}. '
            'Falling back to DummyCache for production.'
        )
        return {
            'default': {
                'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
            }
        }

CACHES = _get_cache_backend()

# ===========================================
# SECURITY MIDDLEWARE SETTINGS
# ===========================================

if not DEBUG:
    # Security settings for production
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    X_FRAME_OPTIONS = 'DENY'
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # Content Security Policy (CSP) - Defense against XSS attacks
    # For better security in production, use nonce-based or hash-based CSP instead of unsafe-inline
    CONTENT_SECURITY_POLICY = {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'https:'],  # Allow data URIs and HTTPS images
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],  # API calls
        'frame-src': ["'none'"],  # No frames allowed
        'object-src': ["'none'"],  # No plugins allowed
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': True,
    }

# ===========================================
# APPLICATION DEFINITION
# ===========================================

# Check if CSP is available
try:
    import csp
    HAS_CSP = True
except ImportError:
    HAS_CSP = False

# Build INSTALLED_APPS
_INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'drf_spectacular',  # OpenAPI/Swagger schema generation
    'rest_framework.authtoken',
    'corsheaders',
    # Main API app (contains CustomUser for backward compatibility)
    'api',
    # Microservices Apps
    'projects',
    'cv',
    'content',
    'interactions',
]

# Add CSP if available
if HAS_CSP:
    _INSTALLED_APPS.insert(9, 'csp')  # Insert before main apps

INSTALLED_APPS = _INSTALLED_APPS

# Base middleware (always available)
_MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.MaliciousActivityDetectionMiddleware',  # Security threat detection
    'api.middleware.SecurityHeadersMiddleware',  # OAuth COOP and security headers
    'api.middleware.PrometheusMetricsMiddleware',
    'api.middleware.VisitorTrackingMiddleware',
]

# Add CSP middleware if available
if HAS_CSP:
    _MIDDLEWARE.insert(7, 'csp.middleware.CSPMiddleware')

MIDDLEWARE = _MIDDLEWARE

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

# Custom User Model
AUTH_USER_MODEL = 'api.CustomUser'

# ===========================================
# DATABASE SETTINGS
# ===========================================

# DATABASE SETTINGS
# Validate required database credentials
DB_PASSWORD = os.environ.get('DB_PASSWORD')
if not DB_PASSWORD:
    if 'test' in sys.argv:
        DB_PASSWORD = ''
    else:
        raise ValueError("DB_PASSWORD environment variable is required")

# Database configuration using environment variables
# Database configuration using environment variables
# Check if we're running tests
if DEBUG:
    # Use SQLite for development to avoid PostgreSQL dependency
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
elif 'pytest' in sys.argv or 'test' in sys.argv or any('test' in arg for arg in sys.argv):
    # Use SQLite for testing to avoid PostgreSQL dependency
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'portfolio_db'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': DB_PASSWORD,  # Use validated environment variable
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),  # Default to 5432 (Docker/standard PostgreSQL port)
        }
    }

# ===========================================
# PASSWORD VALIDATION
# ===========================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ===========================================
# INTERNATIONALIZATION
# ===========================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ===========================================
# STATIC & MEDIA FILES
# ===========================================

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# File upload settings for high-resolution media
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50MB max upload size
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50MB max file size in memory

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ===========================================
# CORS SETTINGS
# ===========================================

if DEBUG:
    # Still restrict origins in DEBUG mode for security
    # Don't use CORS_ALLOW_ALL_ORIGINS = True as it's too permissive
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3003',
        'http://127.0.0.1:3004',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
    logger.warning(f"CORS restricted to: {CORS_ALLOWED_ORIGINS}")
else:
    CORS_ALLOW_ALL_ORIGINS = False
    cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
    if not cors_origins:
        logger.warning("CORS_ALLOWED_ORIGINS not set. API may have CORS issues in production")
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins.split(',') if origin.strip()]

# Allow credentials (cookies) to be sent cross-origin
CORS_ALLOW_CREDENTIALS = True

# ===========================================
# DJANGO REST FRAMEWORK
# ===========================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.CookieTokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/hour',
        'user': '5000/hour',
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',  # OpenAPI schema generation
    'DEFAULT_RENDERERS': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'EXCEPTION_HANDLER': 'api.error_handling.api_exception_handler',
}

# ===========================================
# Spectacular (OpenAPI/Swagger) Settings
# ===========================================
SPECTACULAR_SETTINGS = {
    'TITLE': 'Portfolio API',
    'DESCRIPTION': 'Full-stack portfolio website API with authentication, projects, CV, and interactions.',
    'VERSION': '1.0.0',
    'SCHEMA_PATH_PREFIX': '/api/',
    'AUTHENTICATION_WHITELIST': [
        'api.authentication.CookieTokenAuthentication',
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'SERVE_PERMISSIONS': ['rest_framework.permissions.AllowAny'],
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'defaultModelsExpandDepth': 1,
        'defaultModelExpandDepth': 1,
        'displayOperationId': True,
        'filter': True,
        'showExtensions': True,
    },
    'EXCLUDE_PATHS': [
        r'^/health/$',
        r'^/metrics/$',
    ],
}

# ===========================================
# SOCIAL AUTHENTICATION
# ===========================================

GOOGLE_OAUTH2_CLIENT_ID = os.environ.get('GOOGLE_OAUTH2_CLIENT_ID', '')
GOOGLE_OAUTH2_CLIENT_SECRET = os.environ.get('GOOGLE_OAUTH2_CLIENT_SECRET', '')

FACEBOOK_APP_ID = os.environ.get('FACEBOOK_APP_ID', '')
FACEBOOK_APP_SECRET = os.environ.get('FACEBOOK_APP_SECRET', '')

# ===========================================
# EMAIL SETTINGS
# ===========================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@portfolio.com')

# ===========================================
# LOGGING
# ===========================================

# Check if python-json-logger is available
try:
    import pythonjsonlogger
    HAS_JSON_LOGGER = True
except ImportError:
    HAS_JSON_LOGGER = False

# Ensure the logs directory exists before configuring file handlers
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Base formatters (always available)
LOGGING_FORMATTERS = {
    'verbose': {
        'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
        'style': '{',
    },
    'simple': {
        'format': '{levelname} {message}',
        'style': '{',
    },
}

# Add JSON formatter if available
if HAS_JSON_LOGGER:
    LOGGING_FORMATTERS['json'] = {
        '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
        'format': '%(levelname)s %(asctime)s %(name)s %(message)s'
    }

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': LOGGING_FORMATTERS,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(BASE_DIR / 'logs' / 'django.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'audit_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(BASE_DIR / 'logs' / 'audit.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 20,
            'formatter': 'verbose',
        },
        'security_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(BASE_DIR / 'logs' / 'security.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 20,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'audit': {
            'handlers': ['audit_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'security': {
            'handlers': ['security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

