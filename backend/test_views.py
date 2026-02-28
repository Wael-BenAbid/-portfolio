#!/usr/bin/env python
"""Test script to reproduce the 500 errors in settings and projects views"""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
from django.conf import settings

# Load the Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
django.setup()

from content.models import SiteSettings
from projects.models import Project
from content.serializers import SiteSettingsSerializer
from projects.serializers import ProjectSerializer

print("Testing SiteSettings:")
try:
    settings_obj = SiteSettings.get_settings()
    print(f"  Settings object exists: {settings_obj}")
    serializer = SiteSettingsSerializer(settings_obj)
    print(f"  Serializer data keys: {list(serializer.data.keys())}")
    print("  Settings view should work now")
except Exception as e:
    print(f"  Error: {str(e)}")
    import traceback
    print(f"  Traceback:\n{traceback.format_exc()}")

print("\nTesting Projects:")
try:
    projects = Project.objects.all()
    print(f"  Number of projects: {projects.count()}")
    serializer = ProjectSerializer(projects, many=True)
    print(f"  Number of projects serialized: {len(serializer.data)}")
    print("  Projects view should work now")
except Exception as e:
    print(f"  Error: {str(e)}")
    import traceback
    print(f"  Traceback:\n{traceback.format_exc()}")
