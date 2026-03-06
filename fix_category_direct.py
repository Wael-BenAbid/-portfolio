import django
import os
import sys
from django.db import connection

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
django.setup()

def fix_category_encoding():
    """Fix the category encoding issue by updating the database directly with SQL"""
    try:
        print("Fixing project categories using direct SQL...")
        
        # Direct SQL update to set the correct category for both projects
        with connection.cursor() as cursor:
            # Fix project with id=2 (aaa)
            cursor.execute("UPDATE projects_project SET category = %s, updated_at = NOW() WHERE id = %s", 
                         ('Développement', 2))
            print(f"Updated project 2: {cursor.rowcount} row affected")
            
            # Fix project with id=1 (iphone 17 pro)
            cursor.execute("UPDATE projects_project SET category = %s, updated_at = NOW() WHERE id = %s", 
                         ('Développement', 1))
            print(f"Updated project 1: {cursor.rowcount} row affected")
            
        print("\nAll projects:")
        from projects.models import Project
        for project in Project.objects.all():
            print(f"\nID: {project.id}")
            print(f"Title: {project.title}")
            print(f"Category: '{project.category}'")
            print(f"Category bytes: {project.category.encode('utf-8')}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_category_encoding()
