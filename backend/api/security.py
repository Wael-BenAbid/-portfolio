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
        # Use CORS_ALLOWED_ORIGINS (django-cors-headers) as the source of truth;
        # fall back to CSRF_TRUSTED_ORIGINS if the CORS list is not configured.
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', None) \
            or settings.CSRF_TRUSTED_ORIGINS
        
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
        origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', None) \
            or settings.CSRF_TRUSTED_ORIGINS
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
            return client_id.strip()  # Strip CRLF / whitespace from Windows env files
        
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
        supported_providers = ['google', 'github', 'microsoft']
        
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
    Decorator to rate limit by IP address using django-ratelimit.
    Usage: @rate_limit_by_ip('10/m')
    """
    from django_ratelimit.decorators import ratelimit
    from django_ratelimit.exceptions import Ratelimited

    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            limited = getattr(request, 'limited', False)
            if not limited:
                # Apply ratelimit check inline
                decorated = ratelimit(key='ip', rate=rate, block=False)(func)
                result = decorated(request, *args, **kwargs)
                if getattr(request, 'limited', False):
                    from rest_framework.response import Response as DRFResponse
                    return DRFResponse(
                        {'error': 'Too many requests. Please try again later.'},
                        status=429
                    )
                return result
            return Response(
                {'error': 'Too many requests. Please try again later.'},
                status=429
            )
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


# ===========================================
# Malicious Activity Detection & Alerting
# ===========================================

import sentry_sdk
from django.core.cache import cache


class MaliciousActivityDetector:
    """
    Detects and logs suspicious activity patterns.
    Sends alerts to Sentry for HIGH/CRITICAL threats.
    
    Patterns detected:
    - SQL injection attempts
    - XSS payloads
    - Path traversal attacks
    - Suspicious query parameters
    - Brute force attempts
    - Admin panel probing
    """
    
    # SQL Injection patterns
    SQL_INJECTION_PATTERNS = [
        r"('|\")\s*(or|and)\s*('|\"|\d+)=",
        r"(union|select|insert|update|delete|drop|create|alter)\s*\(",
        r"(union|select|insert|update|delete|drop|create|alter).*\s+(from|into|where)",
        r";\s*(drop|create|alter|delete|update|insert)",
        r"--\s*$",
        r"/\*.*\*/",
        r"xp_",
        r"sp_",
    ]
    
    # XSS patterns
    XSS_PATTERNS = [
        r"<\s*script[^>]*>",
        r"javascript:",
        r"on(load|error|click|mouseover|keypress)\s*=",
        r"<\s*iframe",
        r"<\s*object",
        r"<\s*embed",
        r"<\s*img[^>]*on",
        r"<\s*svg[^>]*on",
    ]
    
    # Path traversal patterns  
    PATH_TRAVERSAL_PATTERNS = [
        r"\.\./",
        r"\.\.",
        r"%2e%2e",
        r"\.\.\\",
    ]
    
    # Suspicious patterns
    SUSPICIOUS_PATTERNS = {
        'admin_probe': r"/(admin|manager|administrator|wp-admin|phpmyadmin)/",
        'config_probe': r"/(config|\.env|\.git|\.hg|\.svn)/",
        'backup_probe': r"\.(bak|backup|old|tar|zip|rar|gz)$",
        'shell_probe': r"\.(php|aspx|jsp|py|rb)\?",
    }
    
    # Cache configuration for rate limiting
    RATE_LIMIT_WINDOW = 3600  # 1 hour
    RATE_LIMIT_THRESHOLD = 100  # requests per window
    
    def __init__(self):
        """Initialize detector with compiled regex patterns."""
        self.sql_patterns = [re.compile(p, re.IGNORECASE) for p in self.SQL_INJECTION_PATTERNS]
        self.xss_patterns = [re.compile(p, re.IGNORECASE) for p in self.XSS_PATTERNS]
        self.path_patterns = [re.compile(p, re.IGNORECASE) for p in self.PATH_TRAVERSAL_PATTERNS]
        self.suspicious_patterns = {
            k: re.compile(v, re.IGNORECASE) 
            for k, v in self.SUSPICIOUS_PATTERNS.items()
        }
    
    def check_request(self, request) -> dict:
        """
        Check request for malicious patterns.
        
        Args:
            request: Django request object
            
        Returns:
            dict: Detection results with keys: is_suspicious, threats, severity
        """
        threats = []
        
        # Get IP for rate limiting
        ip = self._get_client_ip(request)
        
        # Check rate limit
        if not self._check_rate_limit(ip):
            threats.append({
                'type': 'rate_limit',
                'description': f'Excessive requests from {ip}',
                'severity': 'HIGH'
            })
        
        # Check URL for patterns
        url_threats = self._check_string(request.path, 'URL')
        threats.extend(url_threats)
        
        # Check query string
        if request.GET:
            query_threats = self._check_dict(request.GET.dict(), 'Query Parameter')
            threats.extend(query_threats)
        
        # Check POST data
        if request.method == 'POST' and request.POST:
            post_threats = self._check_dict(request.POST.dict(), 'POST Parameter')
            threats.extend(post_threats)
        
        # Check headers for suspicious content
        headers_to_check = ['User-Agent', 'Referer', 'X-Forwarded-For']
        for header in headers_to_check:
            header_key = f'HTTP_{header.upper().replace("-", "_")}'
            if header_key in request.META:
                header_value = request.META.get(header_key, '')
                if header_value:
                    header_threats = self._check_string(header_value, f'Header: {header}')
                    threats.extend(header_threats)
        
        # Determine severity
        severity = 'LOW'
        if any(t.get('severity') == 'CRITICAL' for t in threats):
            severity = 'CRITICAL'
        elif any(t.get('severity') == 'HIGH' for t in threats):
            severity = 'HIGH'
        elif any(t.get('severity') == 'MEDIUM' for t in threats):
            severity = 'MEDIUM'
        
        return {
            'is_suspicious': len(threats) > 0,
            'threats': threats,
            'severity': severity,
            'ip': ip,
            'path': request.path,
            'method': request.method,
        }
    
    def _check_string(self, value: str, field_name: str) -> list:
        """Check a string for malicious patterns."""
        threats = []
        
        if not value:
            return threats
        
        # Check SQL injection
        for pattern in self.sql_patterns:
            if pattern.search(value):
                threats.append({
                    'type': 'sql_injection',
                    'field': field_name,
                    'description': f'Possible SQL injection in {field_name}',
                    'severity': 'CRITICAL',
                    'pattern': 'SQL injection detected'
                })
                break  # Only report once per field
        
        # Check XSS
        for pattern in self.xss_patterns:
            if pattern.search(value):
                threats.append({
                    'type': 'xss',
                    'field': field_name,
                    'description': f'Possible XSS attempt in {field_name}',
                    'severity': 'CRITICAL',
                    'pattern': 'XSS payload detected'
                })
                break
        
        # Check path traversal
        for pattern in self.path_patterns:
            if pattern.search(value):
                threats.append({
                    'type': 'path_traversal',
                    'field': field_name,
                    'description': f'Possible path traversal in {field_name}',
                    'severity': 'HIGH',
                    'pattern': 'Path traversal detected'
                })
                break
        
        # Check suspicious patterns
        for pattern_name, pattern in self.suspicious_patterns.items():
            if pattern.search(value):
                threats.append({
                    'type': pattern_name,
                    'field': field_name,
                    'description': f'Suspicious pattern ({pattern_name}) in {field_name}',
                    'severity': 'MEDIUM' if pattern_name != 'admin_probe' else 'HIGH',
                    'pattern': pattern_name
                })
        
        return threats
    
    def _check_dict(self, data: dict, prefix: str) -> list:
        """Check dictionary values for malicious patterns."""
        threats = []
        for key, value in data.items():
            if isinstance(value, str):
                field_threats = self._check_string(value, f'{prefix}: {key}')
                threats.extend(field_threats)
        return threats
    
    def _get_client_ip(self, request) -> str:
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip
    
    def _check_rate_limit(self, ip: str) -> bool:
        """
        Check if IP has exceeded rate limit for suspicious requests.
        
        Returns:
            bool: True if within limit, False if exceeded
        """
        cache_key = f'malicious_requests:{ip}'
        count = cache.get(cache_key, 0)
        
        if count >= self.RATE_LIMIT_THRESHOLD:
            return False
        
        cache.set(cache_key, count + 1, self.RATE_LIMIT_WINDOW)
        return True
    
    def log_threat(self, detection_result: dict, request=None):
        """
        Log security threat to Sentry and local logger.
        
        Args:
            detection_result: Result from check_request()
            request: Django request object (optional)
        """
        if not detection_result['is_suspicious']:
            return
        
        severity = detection_result['severity']
        threats = detection_result['threats']
        
        # Build message
        threat_descriptions = [t['description'] for t in threats]
        message = f"[{severity}] Security Threat Detected: {'; '.join(threat_descriptions)}"
        
        # Send to Sentry for HIGH/CRITICAL threats
        if severity in ['HIGH', 'CRITICAL']:
            self._send_to_sentry(message, detection_result, severity)
        
        # Log locally
        log_level = 'warning' if severity == 'MEDIUM' else 'error'
        log_func = getattr(logger, log_level)
        log_func(
            message,
            extra={
                'detection_result': detection_result,
                'request_path': request.path if request else None,
                'request_method': request.method if request else None,
                'request_user': str(request.user) if request and request.user else None,
            }
        )
    
    def _send_to_sentry(self, message: str, detection_result: dict, severity: str):
        """Send security event to Sentry."""
        with sentry_sdk.push_scope() as scope:
            scope.set_context('security_threat', {
                'severity': severity,
                'threats': str(detection_result['threats']),
                'ip': detection_result['ip'],
                'path': detection_result['path'],
                'method': detection_result['method'],
            })
            
            # Set level based on severity
            level = 'error' if severity in ['HIGH', 'CRITICAL'] else 'warning'
            scope.set_level(level)
            
            # Add tag for filtering in Sentry
            scope.set_tag('security_threat', severity.lower())
            scope.set_tag('threat_detected', 'true')
            
            sentry_sdk.capture_message(message, level=level)


# Global instance
detector = MaliciousActivityDetector()

# ============================================================================
# LOGGING & ANOMALY DETECTION
# ============================================================================

class SecurityLogger:
    """
    Centralized logging for security events with geolocation and user-agent parsing.
    """
    
    @staticmethod
    def log_login_attempt(user, ip_address, user_agent, status='failed'):
        """
        Log a login attempt with device and geolocation information.
        """
        from .models import LoginActivity
        from user_agents import parse as parse_user_agent
        
        try:
            # Parse user agent
            ua = parse_user_agent(user_agent)
            
            # Create login activity record
            activity = LoginActivity.objects.create(
                user=user,
                status=status,
                ip_address=ip_address,
                user_agent=user_agent[:1000],  # Truncate long user agents
                device_type=ua.device.family or '',
                browser=f"{ua.browser.family or ''} {ua.browser.version_string or ''}".strip(),
                os=f"{ua.os.family or ''} {ua.os.version_string or ''}".strip(),
            )
            
            # Log to Python logger
            logger.info(f"Login {status.upper()}: {user.email if user else 'Unknown'} from {ip_address} via {ua.browser.family}")
            
            # Check for brute force
            if status in ['failed', 'invalid_credentials']:
                SecurityLogger._check_brute_force(ip_address)
            
            return activity
            
        except Exception as e:
            logger.error(f"Error logging login attempt: {str(e)}", exc_info=True)
            # Still create a minimal record
            from .models import LoginActivity
            return LoginActivity.objects.create(
                user=user,
                status=status,
                ip_address=ip_address,
                user_agent=user_agent[:1000]
            )
    
    @staticmethod
    def log_activity(user, action, description, object_type=None, object_id=None,
                    ip_address=None, success=True, error_message=None):
        """
        Log a user activity for audit trail.
        """
        from .models import ActivityLog
        
        try:
            activity = ActivityLog.objects.create(
                user=user,
                action=action,
                description=description,
                object_type=object_type or '',
                object_id=object_id,
                ip_address=ip_address,
                success=success,
                error_message=error_message or ''
            )
            
            # Log to Python logger
            log_msg = f"{action}: {user.email if user else 'System'} - {description}"
            if success:
                logger.info(log_msg)
            else:
                logger.warning(f"{log_msg} (Error: {error_message})")
            
            return activity
            
        except Exception as e:
            logger.error(f"Error logging activity: {str(e)}", exc_info=True)
    
    @staticmethod
    def _check_brute_force(ip_address):
        """
        Check for brute force patterns and create alert if detected.
        """
        from django.utils import timezone
        from datetime import timedelta
        from .models import LoginActivity, SecurityAlert
        
        try:
            five_minutes_ago = timezone.now() - timedelta(minutes=5)
            
            # Count failed attempts in last 5 minutes
            failed_5m = LoginActivity.objects.filter(
                ip_address=ip_address,
                status__in=['failed', 'invalid_credentials'],
                created_at__gte=five_minutes_ago
            ).count()
            
            if failed_5m >= 5:
                # Check if alert already exists for this IP
                existing = SecurityAlert.objects.filter(
                    alert_type='brute_force',
                    evidence__ip=ip_address,
                    status='open'
                ).exists()
                
                if not existing:
                    SecurityAlert.objects.create(
                        alert_type='brute_force',
                        severity='high' if failed_5m >= 10 else 'medium',
                        title=f"Brute force attack from {ip_address}",
                        description=f"{failed_5m} failed login attempts from {ip_address} in 5 minutes",
                        evidence={'ip': ip_address, 'attempts': failed_5m}
                    )
                    logger.warning(f"Brute force alert created for {ip_address}")
        
        except Exception as e:
            logger.error(f"Error checking brute force: {str(e)}", exc_info=True)


class AnomalyDetector:
    """
    Detect unusual patterns in user behavior.
    """
    
    @staticmethod
    def check_mass_api_requests(user, time_window_minutes=5, threshold=100):
        """
        Check if user is making too many API requests.
        """
        from django.utils import timezone
        from datetime import timedelta
        from .models import ActivityLog
        
        try:
            time_window = timezone.now() - timedelta(minutes=time_window_minutes)
            
            request_count = ActivityLog.objects.filter(
                user=user,
                action='api_request',
                created_at__gte=time_window
            ).count()
            
            is_abuse = request_count > threshold
            
            if is_abuse:
                logger.warning(
                    f"API abuse detected: {user.email} made {request_count} requests in {time_window_minutes} minutes"
                )
            
            return is_abuse
        
        except Exception as e:
            logger.error(f"Error checking API abuse: {str(e)}", exc_info=True)
            return False
    
    @staticmethod
    def check_unusual_location(user):
        """
        Check if user logged in from a new or unusual location.
        """
        from .models import LoginActivity
        from django.utils import timezone
        from datetime import timedelta
        
        try:
            # Get last successful login
            last_login = LoginActivity.objects.filter(
                user=user,
                status='success'
            ).order_by('-created_at').first()
            
            if not last_login:
                return False
            
            # Get all unique countries from last 30 days
            thirty_days_ago = timezone.now() - timedelta(days=30)
            known_countries = LoginActivity.objects.filter(
                user=user,
                status='success',
                created_at__gte=thirty_days_ago
            ).values_list('country', flat=True).distinct()
            
            known_countries = set(c for c in known_countries if c)
            
            # If first login or no country data, not unusual
            if not known_countries:
                return False
            
            # Latest login is unusual if from new country
            return last_login.country not in known_countries
        
        except Exception as e:
            logger.error(f"Error checking location: {str(e)}", exc_info=True)
            return False