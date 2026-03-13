from .base import *

DEBUG = True

SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_SSL_REDIRECT = False

# Easier local origins while developing.
CORS_ALLOW_ALL_ORIGINS = True

# Disable throttling in development to avoid rate limit errors during testing
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}

# Use console-only logging in development to avoid file rotation issues on Windows
LOGGING['handlers'] = {
    'console': {'class': 'logging.StreamHandler', 'formatter': 'simple'},
}
LOGGING['loggers'] = {
    'django': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
    'security': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
}
