from django.core.management.base import BaseCommand
from projects.models import Project

class Command(BaseCommand):
    help = 'Fix project category encoding issues'

    def handle(self, *args, **options):
        projects = Project.objects.filter(id__in=[1, 2])
        fixed_count = 0
        
        for project in projects:
            try:
                print(f'Before: Project {project.id} - Category: {repr(project.category)}')
                # Fix UTF-8 encoding issue
                fixed_category = project.category.encode('latin-1').decode('utf-8')
                project.category = fixed_category
                project.save()
                print(f'After: Project {project.id} - Category: {repr(project.category)}')
                fixed_count += 1
            except Exception as e:
                print(f'Error fixing project {project.id}: {e}')
        
        print(f'\nSuccessfully fixed {fixed_count} projects')
        
        # Print all projects after fixing
        print("\nAll projects after fixing:")
        for project in Project.objects.all():
            print(f'ID: {project.id}, Title: {project.title}, Category: {repr(project.category)}')