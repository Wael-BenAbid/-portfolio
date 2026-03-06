import django
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
django.setup()

from projects.models import Project

def fix_category_encoding():
    """Fix the category encoding issue in the database"""
    try:
        print("Fixing project categories...")
        
        # Fix project with id=2 (aaa)
        project2 = Project.objects.get(id=2)
        # Set category directly using bytes to avoid encoding issues
        project2.category = b'D\xc3\xa9veloppement'.decode('utf-8')
        project2.save()
        print(f"Project 'aaa' category fixed to: '{project2.category}'")
        
        # Fix project with id=1 (iphone 17 pro)
        project1 = Project.objects.get(id=1)
        project1.category = b'D\xc3\xa9veloppement'.decode('utf-8')
        project1.save()
        print(f"Project 'iphone 17 pro' category fixed to: '{project1.category}'")
        
        # Verify all projects
        print("\nAll projects:")
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
