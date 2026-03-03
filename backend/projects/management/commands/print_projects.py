from django.core.management.base import BaseCommand
from projects.models import Project, MediaItem


class Command(BaseCommand):
    help = 'Prints information about all projects'

    def handle(self, *args, **options):
        # Get all projects
        projects = Project.objects.all()
        self.stdout.write(f"Total projects: {projects.count()}")
        
        for project in projects:
            self.stdout.write(f"\nProject: {project.title}")
            self.stdout.write(f"Slug: {project.slug}")
            self.stdout.write(f"Category: {project.category}")
            self.stdout.write(f"Description: {project.description}")
            self.stdout.write(f"Thumbnail: {project.thumbnail or 'No thumbnail'}")
            self.stdout.write(f"Created at: {project.created_at}")
            self.stdout.write(f"Active: {project.is_active}")
            
            # Get media items
            media_items = MediaItem.objects.filter(project=project)
            self.stdout.write(f"Media items: {media_items.count()}")
            
            for media in media_items:
                self.stdout.write(f"  - Type: {media.media_type}")
                self.stdout.write(f"    File: {media.file or 'No file'}")
                self.stdout.write(f"    Thumbnail: {media.thumbnail or 'No thumbnail'}")
                self.stdout.write(f"    Caption: {media.caption or 'No caption'}")
                self.stdout.write(f"    Order: {media.order}")
