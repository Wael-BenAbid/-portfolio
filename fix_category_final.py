import os
import sys

# Configure Django settings
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.portfolio.settings')

import django
django.setup()

from projects.models import Project

def fix_project_categories():
    # Fix categories using Django ORM
    projects = Project.objects.all()
    for project in projects:
        try:
            # Try to decode the category from UTF-8 bytes
            if isinstance(project.category, str):
                # Check if category contains UTF-8 bytes encoded as Latin-1
                # e.g., "D\u00c3\u00a9veloppement" should become "Développement"
                decoded_category = project.category.encode('latin-1').decode('utf-8')
                if decoded_category != project.category:
                    print(f"Fixing project {project.id}: '{project.category}' -> '{decoded_category}'")
                    project.category = decoded_category
                    project.save()
        except Exception as e:
            print(f"Error processing project {project.id}: {e}")
            continue
    
    print("\nFixed categories:")
    for project in Project.objects.all():
        print(f"ID: {project.id}, Title: {project.title}, Category: '{project.category}'")

if __name__ == "__main__":
    fix_project_categories()