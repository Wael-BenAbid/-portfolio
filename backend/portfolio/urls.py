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
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Routes - No overlapping prefixes
    path('api/auth/', include('api.urls')),              # Authentication & User Management
    path('api/projects/', include('projects.urls')),     # Projects & Skills
    path('api/cv/', include('cv.urls')),                 # CV Data
    path('api/settings/', include('content.urls')),      # Site Settings, Contact, Upload
    path('api/interactions/', include('interactions.urls')),  # Likes & Notifications
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
