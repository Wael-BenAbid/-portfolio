"""
URL configuration for portfolio project.

API Structure:
- /api/auth/*         - Authentication & User Management
- /api/projects/*     - Projects & Skills  
- /api/cv/*           - CV Data
- /api/settings/*     - Site Settings
- /api/contact/*      - Contact Form
- /api/like/*         - Likes
- /api/notifications/* - Notifications
- /metrics/           - Prometheus Metrics (internal only)
- /health/            - Health check endpoint
- /api/schema/        - OpenAPI schema (for documentation)
- /api/docs/          - Swagger UI documentation
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from api.metrics import metrics_view
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


def health_check(request):
    """Health check endpoint for Docker health checks and load balancers."""
    return JsonResponse({
        'status': 'healthy',
        'service': 'portfolio-backend'
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check endpoint
    path('health/', health_check, name='health'),
    
    # Prometheus Metrics - Direct view to avoid URL conflicts
    path('metrics/', metrics_view, name='metrics'),
    
    # OpenAPI / Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Routes - No overlapping prefixes
    path('api/auth/', include('api.urls')),              # Authentication & User Management
    path('api/security/', include('api.urls_security')), # Security Monitoring & Logging
    path('api/projects/', include('projects.urls')),     # Projects & Skills
    path('api/cv/', include('cv.urls')),                 # CV Data
    path('api/settings/', include('content.urls')),      # Site Settings, Contact, Upload
    path('api/interactions/', include('interactions.urls')),  # Likes & Notifications
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
