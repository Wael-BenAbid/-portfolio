"""
Security utilities for the API
Provides validation, sanitization, and protection utilities
"""
import re
import logging
from functools import wraps
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


# ===========================================
# Input Validation & Sanitization
# ===========================================

class InputValidator:
    """Validates and sanitizes user input"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Validate email format
        Follows RFC 5322 simplified validation
        """
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """
        Validate URL format
        """
        pattern = r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[a-zA-Z0-9./?#@!$&\'()*+,;=_-]*$'
        return bool(re.match(pattern, url))
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 500) -> str:
        """
        Sanitize string input
        - Remove leading/trailing whitespace
        - Truncate to max length
        - Remove null bytes
        """
        if not isinstance(value, str):
            return ""
        
        # Remove null bytes (potential SQL injection vector)
        value = value.replace('\x00', '')
        
        # Strip whitespace
        value = value.strip()
        
        # Truncate
        return value[:max_length]
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """
        Validate password strength
        Requirements:
        - 8+ characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit
        - At least one special character
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        
        if not re.search(r'\d', password):
            return False, "Password must contain at least one digit"
        
        if not re.search(r'[!@#$%^&*()_+=-]', password):
            return False, "Password must contain at least one special character"
        
        return True, "Password is strong"


# ===========================================
# CORS & Origin Validation
# ===========================================

class OriginValidator:
    """Validates request origins safely"""
    
    @staticmethod
    def validate_cors_origin(origin: str) -> bool:
        """
        Validate CORS origin against whitelist
        Prevents subdomain bypass attacks
        """
        allowed_origins = settings.CSRF_TRUSTED_ORIGINS
        
        if not origin:
            return False
        
        # Exact match first
        if origin in allowed_origins:
            return True
        
        # Pattern matching (optional, use with caution)
        for allowed in allowed_origins:
            # Disallow wildcard domains as they're too permissive
            if '*' in allowed:
                logger.warning(f"Wildcard in CORS origin: {allowed}")
                continue
            
            # Check if origin is a valid subdomain of allowed origin
            if origin.endswith('.' + allowed) or origin == allowed:
                return True
        
        logger.warning(f"CORS origin rejected: {origin}")
        return False
    
    @staticmethod
    def get_trusted_origins() -> list[str]:
        """Get list of trusted origins from settings"""
        origins = settings.CSRF_TRUSTED_ORIGINS
        if isinstance(origins, str):
            return [o.strip() for o in origins.split(',')]
        return origins


# ===========================================
# OAuth Security
# ===========================================

class OAuthSecurityManager:
    """Manages OAuth security validations"""
    
    @staticmethod
    def get_oauth_client_id(provider: str) -> str | None:
        """
        Safely retrieve OAuth client ID
        Fails closed if not configured
        """
        if provider == 'google':
            client_id = getattr(settings, 'GOOGLE_OAUTH2_CLIENT_ID', None)
            if not client_id:
                logger.error(f"OAuth provider {provider} not configured: missing CLIENT_ID")
                return None
            return client_id
        
        elif provider == 'facebook':
            client_id = getattr(settings, 'FACEBOOK_OAUTH2_CLIENT_ID', None)
            if not client_id:
                logger.error(f"OAuth provider {provider} not configured: missing CLIENT_ID")
                return None
            return client_id
        
        logger.error(f"Unknown OAuth provider: {provider}")
        return None
    
    @staticmethod
    def validate_oauth_provider(provider: str) -> bool:
        """Validate that OAuth provider is supported and configured"""
        supported_providers = ['google', 'facebook']
        
        if provider not in supported_providers:
            logger.warning(f"Unsupported OAuth provider: {provider}")
            return False
        
        client_id = OAuthSecurityManager.get_oauth_client_id(provider)
        if not client_id:
            logger.warning(f"OAuth provider not configured: {provider}")
            return False
        
        return True


# ===========================================
# Rate Limiting Decorators
# ===========================================

def rate_limit_by_ip(rate: str = '10/m'):
    """
    Decorator to rate limit by IP address
    Usage: @rate_limit_by_ip('10/m')
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # This is a placeholder - actual implementation should use django-ratelimit
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


# ===========================================
# Audit Logging
# ===========================================

class AuditLogger:
    """Logs security-relevant events for audit trail"""
    
    audit_logger = logging.getLogger('audit')
    
    @staticmethod
    def log_auth_event(event_type: str, user=None, ip_address: str = None, details: dict = None):
        """
        Log authentication-related events
        
        Args:
            event_type: 'login', 'logout', 'failed_login', 'password_change', etc.
            user: User object (not for failed logins - don't enumerate users)
            ip_address: IP address of request
            details: Additional context (no sensitive data)
        """
        log_data = {
            'event_type': event_type,
            'timestamp': __import__('datetime').datetime.utcnow().isoformat(),
            'ip_address': ip_address,
            'user_id': user.id if user else None,
        }
        
        if details:
            log_data.update(details)
        
        AuditLogger.audit_logger.info(
            f"AUTH_EVENT: {event_type}",
            extra=log_data
        )
    
    @staticmethod
    def log_admin_action(action_type: str, admin_user, target_user=None, details: dict = None):
        """
        Log admin actions for compliance
        
        Args:
            action_type: 'user_created', 'user_deleted', 'user_updated', etc.
            admin_user: Admin user performing action
            target_user: User being acted upon
            details: Additional context
        """
        log_data = {
            'action_type': action_type,
            'timestamp': __import__('datetime').datetime.utcnow().isoformat(),
            'admin_user_id': admin_user.id if admin_user else None,
            'target_user_id': target_user.id if target_user else None,
        }
        
        if details:
            log_data.update(details)
        
        AuditLogger.audit_logger.warning(
            f"ADMIN_ACTION: {action_type}",
            extra=log_data
        )
    
    @staticmethod
    def log_security_event(event_type: str, severity: str, details: dict = None):
        """
        Log security-related events
        
        Args:
            event_type: 'failed_csrf', 'invalid_oauth_token', 'rate_limit_exceeded', etc.
            severity: 'low', 'medium', 'high', 'critical'
            details: Additional context (no sensitive data)
        """
        log_data = {
            'event_type': event_type,
            'severity': severity,
            'timestamp': __import__('datetime').datetime.utcnow().isoformat(),
        }
        
        if details:
            log_data.update(details)
        
        log_method = {
            'low': AuditLogger.audit_logger.info,
            'medium': AuditLogger.audit_logger.warning,
            'high': AuditLogger.audit_logger.error,
            'critical': AuditLogger.audit_logger.critical,
        }.get(severity, AuditLogger.audit_logger.warning)
        
        log_method(
            f"SECURITY_EVENT: {event_type}",
            extra=log_data
        )


# ===========================================
# Safe Response Builders
# ===========================================

def create_error_response(message: str, code: str, status_code: int, details: dict = None):
    """
    Create a standardized error response
    Never includes stack traces or sensitive debug info in response
    """
    response_data = {
        'error': {
            'code': code,
            'message': message,
        }
    }
    
    # Only include details in DEBUG mode
    if settings.DEBUG and details:
        response_data['error']['details'] = details
    
    return Response(response_data, status=status_code)


def create_success_response(data: dict, message: str = None, status_code: int = status.HTTP_200_OK):
    """Create a standardized success response"""
    response_data = {
        'success': True,
        'data': data,
    }
    
    if message:
        response_data['message'] = message
    
    return Response(response_data, status=status_code)
