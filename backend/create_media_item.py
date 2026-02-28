#!/usr/bin/env python
"""Create a test media item for the project with id=1"""

import sys
import os

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
from django.conf import settings

# Load the Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
django.setup()

from projects.models import Project, MediaItem

try:
    # Get the project with id=1
    project = Project.objects.get(id=1)
    print(f"Project: {project.title}")
    
    # Create a test media item
    media_item = MediaItem.objects.create(
        project=project,
        media_type='image',
        url='http://localhost:8000/media/uploads/17_pro_max.jpeg',
        order=0
    )
    print(f"Created media item: {media_item}")
    
    # Check the number of media items
    print(f"Number of media items for project: {project.media.count()}")
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    print(f"Traceback:\n{traceback.format_exc()}")
