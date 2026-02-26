"""
Prometheus Metrics for Django Backend
"""
from django.http import HttpResponse, HttpResponseForbidden
from prometheus_client import (
    generate_latest,
    Counter,
    Histogram,
    Gauge,
    CONTENT_TYPE_LATEST
)
from django.conf import settings
import time
from projects.models import Project, MediaItem
from api.models import CustomUser
from interactions.models import Like
import os
import ipaddress
import logging

logger = logging.getLogger(__name__)

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


def metrics_view(request):
    """
    Prometheus metrics endpoint
    
    Security: Only accessible by authenticated staff users or specific internal IPs
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
    
    # Update custom metrics
    PROJECT_COUNT.set(Project.objects.count())
    MEDIA_COUNT.set(MediaItem.objects.count())
    USER_COUNT.set(CustomUser.objects.count())
    LIKE_COUNT.set(Like.objects.count())

    return HttpResponse(
        generate_latest(),
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
