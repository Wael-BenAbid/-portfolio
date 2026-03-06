import os
import sys

# Configure Django settings
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.portfolio.settings')

import django
django.setup()

from projects.models import Project

print("Fixing project categories...")

projects = Project.objects.filter(id__in=[1, 2])

for project in projects:
    print(f"Project {project.id}: Before - '{project.category}'")
    try:
        # Fix UTF-8 encoding issue
        fixed_category = project.category.encode('latin-1').decode('utf-8')
        project.category = fixed_category
        project.save()
        print(f"Project {project.id}: After - '{project.category}'")
    except Exception as e:
        print(f"Error fixing project {project.id}: {e}")

print("\nAll projects after fixing:")
for project in Project.objects.all():
    print(f"ID: {project.id}, Title: {project.title}, Category: '{project.category}'")