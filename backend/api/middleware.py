"""
Middleware for request tracking and metrics collection
"""
import time
import re
import logging
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from prometheus_client import Counter, Histogram
from .metrics import REQUEST_COUNT, REQUEST_DURATION, _get_client_ip
from .models import Visitor
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


class VisitorTrackingMiddleware(MiddlewareMixin):
    """
    Middleware to track website visitors with performance optimizations
    """
    
    # Exclude static files and API endpoints from tracking
    EXCLUDE_PATTERNS = [
        re.compile(r'^/static/'),
        re.compile(r'^/media/'),
        re.compile(r'^/admin/'),
        re.compile(r'^/api/metrics/'),
        re.compile(r'^/api/visitors/'),
    ]
    
    # Cache keys for performance optimization
    CACHE_PREFIX = 'visitor_tracking'
    CACHE_TTL = 300  # 5 minutes
    
    def process_response(self, request, response):
        """
        Track visitor information when response is returned (with GDPR compliance).

        GDPR Compliance:
        - Only tracks visitors who gave consent
        - Anonymizes IP addresses (last octet = 0)
        - Auto-deletes records after 90 days
        - Stores consent record reference for audit trail
        """
        # Skip tracking if disabled in settings
        if getattr(settings, 'DISABLE_VISITOR_TRACKING', False):
            return response
        
        # Skip tracking for excluded paths
        path = request.path_info
        for pattern in self.EXCLUDE_PATTERNS:
            if pattern.match(path):
                return response
        
        # Skip tracking for health checks
        if path in ['/health', '/healthz', '/ready', '/api/health/']:
            return response
        
        # Skip tracking for non-successful responses (optional)
        if response.status_code >= 400:
            return response
        
        # Track visitor with GDPR compliance
        try:
            from .models import VisitorConsent
            
            # Get session key for consent tracking
            session_key = request.session.session_key if hasattr(request, 'session') and request.session.session_key else None
            if not session_key:
                return response  # Can't track without session
            
            # Get visitor information from request
            ip_address = self.get_ip_address(request)
            user_agent = self.sanitize_user_agent(request.META.get('HTTP_USER_AGENT', ''))
            referrer = self.sanitize_referrer(request.META.get('HTTP_REFERER', ''))
            user = request.user if request.user.is_authenticated else None
            
            # Get or create consent record
            consent = VisitorConsent.get_or_create_consent(
                session_key=session_key,
                ip_address=ip_address,
                consent_given=request.COOKIES.get('tracking_consent') == 'accepted'
            )
            
            # Only track if user gave consent
            if not consent.is_valid():
                # User didn't give consent or consent expired
                return response
            
            # Rate limiting: Skip tracking if this IP was tracked recently
            cache_key = f"{self.CACHE_PREFIX}:ip:{ip_address}"
            if cache.get(cache_key):
                return response
            
            # Set cache to prevent tracking same IP too frequently
            cache.set(cache_key, True, self.CACHE_TTL)
            
            # Anonymize IP address (zero out last octet)
            anonymized_ip = self._anonymize_ip(ip_address)
            
            # Create visitor record
            Visitor.objects.create(
                anonymized_ip=anonymized_ip,     # Use anonymized IP, not raw
                user_agent=user_agent,
                referrer=referrer,
                path=path,
                session_key=session_key,
                user=user,
                visit_time=timezone.now(),
                is_unique=self.is_unique_visitor(anonymized_ip, session_key),
                device_type=self.get_device_type(user_agent),
                browser=self.get_browser(user_agent),
                os=self.get_os(user_agent),
                consent_record=consent,  # Reference the consent record
            )
        except Exception as e:
            # Log error but don't break response
            logger.error(f"Error tracking visitor: {e}", exc_info=True)
        
        return response
    
    def _anonymize_ip(self, ip_address: str) -> str:
        """
        Anonymize IP address by zeroing out the last octet.
        
        Examples:
            192.168.1.42 → 192.168.1.0
            2001:db8::1 → IPv6 not anonymized (too complex)
        
        GDPR Compliance:
            IP addresses are considered personal data. Anonymizing them
            ensures we're not storing personally identifiable information.
        
        Args:
            ip_address: The IP address to anonymize
            
        Returns:
            str: Anonymized IP address, or None if invalid
        """
        if not ip_address:
            return None
        
        # Handle IPv4
        parts = ip_address.split('.')
        if len(parts) == 4:
            try:
                # Verify it's valid IPv4
                for part in parts:
                    int(part)
                # Zero out last octet
                parts[-1] = '0'
                return '.'.join(parts)
            except ValueError:
                return None
        
        # IPv6 - leave as-is (too complex to anonymize properly)
        return ip_address
    
    
    def sanitize_user_agent(self, user_agent):
        """Sanitize user agent string to prevent malicious input"""
        if not user_agent:
            return ''
        # Limit length and strip potentially harmful characters
        sanitized = str(user_agent)[:500]  # Limit to 500 characters
        sanitized = sanitized.strip()
        return sanitized
    
    def sanitize_referrer(self, referrer):
        """Sanitize referrer URL"""
        if not referrer:
            return ''
        sanitized = str(referrer)[:500]  # Limit to 500 characters
        sanitized = sanitized.strip()
        return sanitized
    
    def get_ip_address(self, request):
        """
        Get real IP address from request (handling proxies).
        
        Security: Uses the secure _get_client_ip function from metrics.py
        which only trusts X-Forwarded-For headers from trusted proxies.
        """
        return _get_client_ip(request)
    
    def is_unique_visitor(self, ip_address, session_key):
        """Check if visitor is unique (for the current day)"""
        today = timezone.now().date()
        # Use cache to avoid database query on every tracked request
        cache_key = f"{self.CACHE_PREFIX}:unique:{ip_address}:{today}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        # Check if there's already a unique visitor record for this IP address today
        is_unique = not Visitor.objects.filter(
            anonymized_ip=ip_address,
            visit_time__date=today,
            is_unique=True
        ).exists()
        # Cache for 24 hours (until the date changes)
        cache.set(cache_key, is_unique, 86400)
        return is_unique
    
    def get_device_type(self, user_agent):
        """Determine device type from user agent"""
        if not user_agent:
            return 'Unknown'
        
        user_agent = user_agent.lower()
        if any(keyword in user_agent for keyword in ['mobile', 'android', 'iphone', 'ipad', 'ipod']):
            return 'Mobile'
        elif 'tablet' in user_agent:
            return 'Tablet'
        else:
            return 'Desktop'
    
    def get_browser(self, user_agent):
        """Determine browser from user agent"""
        if not user_agent:
            return 'Unknown'
        
        user_agent = user_agent.lower()
        if 'chrome' in user_agent:
            return 'Chrome'
        elif 'firefox' in user_agent:
            return 'Firefox'
        elif 'safari' in user_agent and 'chrome' not in user_agent:
            return 'Safari'
        elif 'edge' in user_agent:
            return 'Edge'
        elif 'opera' in user_agent:
            return 'Opera'
        else:
            return 'Unknown'
    
    def get_os(self, user_agent):
        """Determine operating system from user agent"""
        if not user_agent:
            return 'Unknown'
        
        user_agent = user_agent.lower()
        if 'windows' in user_agent:
            return 'Windows'
        elif 'mac' in user_agent:
            return 'macOS'
        elif 'linux' in user_agent:
            return 'Linux'
        elif 'android' in user_agent:
            return 'Android'
        elif 'ios' in user_agent or 'iphone' in user_agent or 'ipad' in user_agent:
            return 'iOS'
        else:
            return 'Unknown'


class PrometheusMetricsMiddleware(MiddlewareMixin):
    """
    Middleware to collect Prometheus metrics for HTTP requests
    """
    
    def process_request(self, request):
        """
        Store request start time in request.META
        """
        request.META['_start_time'] = time.time()
        return None  # Explicit return for clarity
    
    def process_response(self, request, response):
        """
        Collect metrics when response is returned
        """
        # Calculate request duration
        duration = time.time() - request.META.get('_start_time', time.time())
        
        # Get request path without query parameters
        path = request.path_info
        
        # Collect metrics
        REQUEST_COUNT.labels(
            method=request.method,
            path=path,
            status=response.status_code
        ).inc()
        
        REQUEST_DURATION.labels(
            method=request.method,
            path=path
        ).observe(duration)
        
        return response


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers for OAuth and CORS functionality.
    
    This middleware adds headers that:
    - Allow Google's postMessage for OAuth flows (COOP)
    - Allow proper cross-origin resource sharing
    - Protect against XSS and clickjacking
    """
    
    def process_response(self, request, response):
        """
        Add security headers to response
        """
        # Allow Cross-Origin-Opener-Policy for OAuth flows
        # 'same-origin-allow-popups' allows popups from same origin to maintain opener reference
        # This is necessary for Google OAuth signin callbacks
        response['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
        
        # Referrer policy for privacy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # X-Content-Type-Options prevents MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # X-Frame-Options prevents clickjacking
        response['X-Frame-Options'] = 'SAMEORIGIN'
        
        # X-XSS-Protection for older browsers (modern browsers use CSP)
        response['X-XSS-Protection'] = '1; mode=block'
        
        return response


class MaliciousActivityDetectionMiddleware(MiddlewareMixin):
    """
    Middleware to detect and log malicious activity.
    
    Detects:
    - SQL injection attempts
    - XSS payloads
    - Path traversal attacks
    - Admin panel probing
    - Rate limit violations
    
    Automatically blocks requests with CRITICAL threats.
    Sends alerts to Sentry for HIGH/CRITICAL threats.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Import here to avoid circular imports
        from .security import detector
        self.detector = detector
    
    def process_request(self, request):
        """
        Check request for malicious patterns before processing.
        """
        # Skip security checks for health-check and metrics endpoints
        if request.path in ['/health/', '/api/metrics/']:
            return None
        
        # Check for malicious patterns
        detection_result = self.detector.check_request(request)
        
        # Log any detected threats
        if detection_result['is_suspicious']:
            self.detector.log_threat(detection_result, request)
        
        # Block CRITICAL threats immediately
        if detection_result['severity'] == 'CRITICAL':
            logger.error(
                f"CRITICAL security threat blocked: {detection_result['threats']}, IP: {detection_result['ip']}"
            )
            # Return 403 Forbidden for critical threats
            from .security import create_error_response
            return create_error_response(
                message='Request blocked due to security policy',
                code='SECURITY_VIOLATION',
                status_code=403
            )
        
        # Attach detection result to request for logging in response middleware
        request.security_detection = detection_result
        return None
    
    def process_response(self, request, response):
        """
        Add security event headers to response if threat detected.
        """
        detection = getattr(request, 'security_detection', None)
        if detection and detection['is_suspicious'] and detection['severity'] in ['MEDIUM']:
            # Add header to indicate suspicious request was processed
            response['X-Security-Alert'] = f"Suspicious activity detected: {detection['severity']}"
        
        return response


# ============================================================================
# ACTIVITY LOGGING MIDDLEWARE
# ============================================================================

class ActivityLoggingMiddleware(MiddlewareMixin):
    """
    Log all authenticated API mutations (POST/PUT/PATCH/DELETE) to ActivityLog.
    Tracks data creation, updates and deletions for the audit trail.
    """

    MUTATING_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}

    _ACTION_MAP = {
        'POST':   'data_create',
        'PUT':    'data_update',
        'PATCH':  'data_update',
        'DELETE': 'data_delete',
    }

    _SKIP_PREFIXES = (
        '/api/auth/',
        '/api/metrics',
        '/api/visitors/',
        '/api/security/',
        '/admin/',
        '/static/',
        '/media/',
    )

    def process_response(self, request, response):
        try:
            if request.method not in self.MUTATING_METHODS:
                return response
            if not request.path.startswith('/api/'):
                return response
            if any(request.path.startswith(p) for p in self._SKIP_PREFIXES):
                return response

            user = getattr(request, 'user', None)
            if not user or not user.is_authenticated:
                return response

            action = self._ACTION_MAP.get(request.method, 'api_request')
            success = 200 <= response.status_code < 400
            description = f"{request.method} {request.path}"
            error_msg = '' if success else f"HTTP {response.status_code}"

            from .security import SecurityLogger
            SecurityLogger.log_activity(
                user=user,
                action=action,
                description=description,
                ip_address=self._get_client_ip(request),
                success=success,
                error_message=error_msg,
            )
        except Exception:
            pass

        return response

    @staticmethod
    def _get_client_ip(request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            return xff.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '127.0.0.1')
