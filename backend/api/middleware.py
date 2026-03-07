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
