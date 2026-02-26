"""
Prometheus Metrics Middleware
"""
import time
from django.utils.deprecation import MiddlewareMixin
from prometheus_client import Counter, Histogram
from .metrics import REQUEST_COUNT, REQUEST_DURATION


class PrometheusMetricsMiddleware(MiddlewareMixin):
    """
    Middleware to collect Prometheus metrics for HTTP requests
    """
    
    def process_request(self, request):
        """
        Store request start time in request.META
        """
        request.META['_start_time'] = time.time()
    
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
