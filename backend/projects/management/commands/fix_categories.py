from django.core.management.base import BaseCommand
from projects.models import Project

class Command(BaseCommand):
    help = 'Fix project category encoding issues'

    def handle(self, *args, **options):
        projects = Project.objects.all()
        fixed_count = 0
        
        for project in projects:
            try:
                # Fix UTF-8 encoding issue (Latin-1 -> UTF-8)
                decoded_category = project.category.encode('latin-1').decode('utf-8')
                if decoded_category != project.category:
                    self.stdout.write(f"Fixing project {project.id}: '{project.category}' -> '{decoded_category}'")
                    project.category = decoded_category
                    project.save()
                    fixed_count += 1
            except Exception as e:
                self.stderr.write(f"Error processing project {project.id}: {e}")
                continue
        
        self.stdout.write(self.style.SUCCESS(f"Successfully fixed {fixed_count} projects"))
        
        # Print all projects after fixing
        self.stdout.write("\nAll projects after fixing:")
        for project in Project.objects.all():
            self.stdout.write(f"ID: {project.id}, Title: {project.title}, Category: '{project.category}'")