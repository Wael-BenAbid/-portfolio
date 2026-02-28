"""
Prometheus Metrics for Django Backend
"""
from django.http import HttpResponse, HttpResponseForbidden
from django.core.cache import cache
from prometheus_client import (
    generate_latest,
    Counter,
    Histogram,
    Gauge,
    CONTENT_TYPE_LATEST
)
from django.conf import settings
import time
import os
import ipaddress
import logging
from django.db import models

logger = logging.getLogger(__name__)

# Cache configuration for metrics
METRICS_CACHE_KEY = 'prometheus_metrics_data'
METRICS_CACHE_TTL = 300  # Cache metrics for 5 minutes (typical Prometheus scrape interval)

# Request metrics
REQUEST_COUNT = Counter(
    'django_http_requests_total',
    'Total HTTP requests',
    ['method', 'path', 'status']
)

REQUEST_DURATION = Histogram(
    'django_http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'path']
)

# Database metrics
DB_QUERY_COUNT = Counter(
    'django_db_queries_total',
    'Total database queries',
    ['operation']
)

# Custom metrics
PROJECT_COUNT = Gauge(
    'django_projects_count',
    'Number of projects'
)

MEDIA_COUNT = Gauge(
    'django_media_count',
    'Number of media items'
)

USER_COUNT = Gauge(
    'django_users_count',
    'Number of users'
)

LIKE_COUNT = Gauge(
    'django_likes_count',
    'Number of likes'
)

# Visitor metrics
VISITOR_COUNT = Gauge(
    'django_visitors_count',
    'Number of visitors'
)

UNIQUE_VISITOR_COUNT = Gauge(
    'django_unique_visitors_count',
    'Number of unique visitors'
)

PAGE_VIEW_COUNT = Gauge(
    'django_page_views_count',
    'Number of page views'
)

BOUNCE_RATE = Gauge(
    'django_bounce_rate',
    'Bounce rate percentage'
)

# Visitor distribution metrics
DEVICE_TYPE_COUNT = Gauge(
    'django_visitors_by_device',
    'Number of visitors by device type',
    ['device_type']
)

BROWSER_COUNT = Gauge(
    'django_visitors_by_browser',
    'Number of visitors by browser',
    ['browser']
)

OS_COUNT = Gauge(
    'django_visitors_by_os',
    'Number of visitors by operating system',
    ['os']
)

# Page popularity metrics
PAGE_VIEWS = Gauge(
    'django_page_views',
    'Number of views per page',
    ['path']
)


def _get_client_ip(request):
    """
    Get the real client IP address, handling proxies.
    
    Checks X-Forwarded-For header first (when behind proxy/load balancer),
    then falls back to REMOTE_ADDR.
    
    Security: Only trusts X-Forwarded-For if the request comes from a known proxy.
    """
    # Get the immediate remote address
    remote_addr = request.META.get('REMOTE_ADDR', '')
    
    # Check if request comes from a trusted proxy
    # In Docker/Kubernetes, internal proxies typically use private IP ranges
    if _is_trusted_proxy(remote_addr):
        # Check X-Forwarded-For header
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if x_forwarded_for:
            # X-Forwarded-For format: client, proxy1, proxy2, ...
            # Take the first (leftmost) IP which is the original client
            ips = [ip.strip() for ip in x_forwarded_for.split(',')]
            if ips:
                return ips[0]
    
    # Also check X-Real-IP header (used by nginx)
    x_real_ip = request.META.get('HTTP_X_REAL_IP', '')
    if x_real_ip and _is_trusted_proxy(remote_addr):
        return x_real_ip
    
    return remote_addr


def _is_trusted_proxy(ip: str) -> bool:
    """
    Check if the IP is a trusted proxy (internal load balancer, nginx, etc.)
    Uses the same IP ranges as metrics allowed IPs.
    """
    if not ip:
        return False
    
    # Trusted proxies are typically internal Docker/K8s networks
    # Same ranges as allowed for metrics access
    trusted_proxy_ranges = os.environ.get(
        'TRUSTED_PROXY_IPS',
        '127.0.0.1,::1,172.16.0.0/12,10.0.0.0/8,192.168.0.0/16'
    )
    
    ranges = [r.strip() for r in trusted_proxy_ranges.split(',') if r.strip()]
    
    try:
        ip_obj = ipaddress.ip_address(ip)
        for ip_range in ranges:
            try:
                if '/' in ip_range:
                    network = ipaddress.ip_network(ip_range, strict=False)
                    if ip_obj in network:
                        return True
                else:
                    if ip_obj == ipaddress.ip_address(ip_range):
                        return True
            except ValueError:
                continue
    except ValueError:
        pass
    
    return False


def _update_metrics():
    """
    Update all custom metrics with current database values.
    This function is cached to avoid excessive database queries.
    """
    try:
        # Lazy imports to avoid circular import issues during Django app loading
        from projects.models import Project, MediaItem
        from api.models import CustomUser, Visitor
        from interactions.models import Like

        # Update basic metrics
        PROJECT_COUNT.set(Project.objects.count())
        MEDIA_COUNT.set(MediaItem.objects.count())
        USER_COUNT.set(CustomUser.objects.count())
        LIKE_COUNT.set(Like.objects.count())
        
        # Visitor metrics (optimized single query approach)
        visitor_stats = Visitor.objects.aggregate(
            total_visits=models.Count('id'),
            unique_visitors=models.Count('id', filter=models.Q(is_unique=True)),
        )
        
        VISITOR_COUNT.set(visitor_stats['total_visits'])  # Total page views/visits
        UNIQUE_VISITOR_COUNT.set(visitor_stats['unique_visitors'])  # Unique visitors
        PAGE_VIEW_COUNT.set(visitor_stats['total_visits'])  # Each visitor entry is a page view
        
        # Bounce rate calculation - optimized with single aggregation
        # Count sessions with only one page view vs total unique sessions
        from django.db.models import Count, Q
        
        # Single query to get both counts efficiently
        session_stats = Visitor.objects.values('session_key').annotate(
            visit_count=Count('id')
        ).aggregate(
            total_sessions=Count('session_key', distinct=True),
            single_page_sessions=Count('session_key', filter=Q(visit_count=1))
        )
        
        total_sessions = session_stats['total_sessions'] or 0
        single_page_sessions = session_stats['single_page_sessions'] or 0
        
        bounce_rate = (single_page_sessions / total_sessions) * 100 if total_sessions else 0
        BOUNCE_RATE.set(round(bounce_rate, 2))
        
        # Device, browser, and OS distribution (using single queries per distribution)
        device_distribution = Visitor.objects.values('device_type').annotate(count=models.Count('id'))
        for device in device_distribution:
            DEVICE_TYPE_COUNT.labels(device_type=device['device_type']).set(device['count'])
        
        browser_distribution = Visitor.objects.values('browser').annotate(count=models.Count('id'))
        for browser in browser_distribution:
            BROWSER_COUNT.labels(browser=browser['browser']).set(browser['count'])
        
        os_distribution = Visitor.objects.values('os').annotate(count=models.Count('id'))
        for os in os_distribution:
            OS_COUNT.labels(os=os['os']).set(os['count'])
        
        # Page views per path
        page_views = Visitor.objects.values('path').annotate(count=models.Count('id'))
        for page in page_views:
            PAGE_VIEWS.labels(path=page['path']).set(page['count'])
    except Exception as e:
        # Log error but don't crash the metrics endpoint
        logger.error(f"Error updating metrics: {e}", exc_info=True)
        # Set metrics to safe defaults to avoid stale data
        VISITOR_COUNT.set(0)
        UNIQUE_VISITOR_COUNT.set(0)
        PAGE_VIEW_COUNT.set(0)
        BOUNCE_RATE.set(0)


def metrics_view(request):
    """
    Prometheus metrics endpoint with caching for performance
    
    Security: Only accessible by authenticated staff users or specific internal IPs
    Performance: Metrics are cached for 60 seconds to reduce database load
    """
    # Allow if user is authenticated staff
    if request.user.is_authenticated and request.user.is_staff:
        pass  # Allow access
    else:
        # Check if request comes from allowed IP
        client_ip = _get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
        request_path = request.META.get('PATH_INFO', 'Unknown')
        
        if not _is_ip_allowed(client_ip):
            logger.warning(
                f"Metrics access denied - IP: {client_ip}, "
                f"User-Agent: {user_agent}, Path: {request_path}"
            )
            return HttpResponseForbidden("Access denied. Authentication required.")
    
    # Check if metrics are cached
    try:
        cached_metrics = cache.get(METRICS_CACHE_KEY)
        if cached_metrics:
            return HttpResponse(
                cached_metrics,
                content_type=CONTENT_TYPE_LATEST
            )
    except Exception as e:
        logger.warning(f"Cache get error, generating fresh metrics: {e}")

    # Update metrics with current database values
    _update_metrics()

    # Generate metrics output
    metrics_output = generate_latest()

    # Cache the metrics output
    try:
        cache.set(METRICS_CACHE_KEY, metrics_output, METRICS_CACHE_TTL)
    except Exception as e:
        logger.warning(f"Cache set error, metrics not cached: {e}")
    
    return HttpResponse(
        metrics_output,
        content_type=CONTENT_TYPE_LATEST
    )


def _is_ip_allowed(ip: str) -> bool:
    """
    Check if IP is allowed to access metrics.
    
    Uses CIDR notation for flexible IP range matching.
    Default allowed ranges:
    - 127.0.0.1 (localhost)
    - ::1 (localhost IPv6)
    - 172.17.0.0/16 (Docker default bridge)
    - 172.18.0.0/16 to 172.31.0.0/16 (Docker custom networks)
    - 10.0.0.0/8 (Private network - common in cloud)
    - 192.168.0.0/16 (Private network)
    
    Can be customized via METRICS_ALLOWED_IPS environment variable.
    """
    if not ip:
        return False
    
    # Get allowed IP ranges from environment or use defaults
    # Format: comma-separated CIDR notations
    # Example: METRICS_ALLOWED_IPS=127.0.0.1,10.0.0.0/8,172.17.0.0/16
    allowed_ranges_str = os.environ.get(
        'METRICS_ALLOWED_IPS',
        '127.0.0.1,::1,172.17.0.0/16,172.18.0.0/16,172.19.0.0/16,172.20.0.0/16,'
        '172.21.0.0/16,172.22.0.0/16,172.23.0.0/16,172.24.0.0/16,172.25.0.0/16,'
        '172.26.0.0/16,172.27.0.0/16,172.28.0.0/16,172.29.0.0/16,172.30.0.0/16,'
        '172.31.0.0/16,10.0.0.0/8,192.168.0.0/16'
    )
    
    allowed_ranges = [r.strip() for r in allowed_ranges_str.split(',') if r.strip()]
    
    try:
        client_ip_obj = ipaddress.ip_address(ip)
        
        for ip_range in allowed_ranges:
            try:
                # Handle both single IPs and CIDR ranges
                if '/' in ip_range:
                    network = ipaddress.ip_network(ip_range, strict=False)
                    if client_ip_obj in network:
                        return True
                else:
                    # Single IP address
                    if client_ip_obj == ipaddress.ip_address(ip_range):
                        return True
            except ValueError as e:
                logger.warning(f"Invalid IP range in METRICS_ALLOWED_IPS: {ip_range} - {e}")
                continue
                
    except ValueError:
        logger.warning(f"Invalid client IP address: {ip}")
        return False
    
    return False
