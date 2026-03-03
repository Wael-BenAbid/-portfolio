from projects.models import Project, MediaItem
from django.utils import timezone
from django.conf import settings
import os

def create_test_project():
    """Create a test project with media items for development purposes"""
    # Check if the project exists
    try:
        project = Project.objects.get(slug='test-project-with-media')
        print('Project already exists, using existing project')
    except Project.DoesNotExist:
        # Create project
        project = Project.objects.create(
            title='Test Project with Media',
            slug='test-project-with-media',
            description='This is a test project with media files to demonstrate the carousel',
            category='Development',
            thumbnail='https://picsum.photos/seed/test-thumb/800/600.jpg',
            created_at=timezone.now(),
            updated_at=timezone.now(),
            is_active=True,
            featured=True
        )
        print('Project created successfully!')

    # Check if media items exist
    if project.media.count() == 0:
        # Create media items - only in development mode
        if settings.DEBUG:
            for i in range(1, 4):
                MediaItem.objects.create(
                    project=project,
                    media_type='image',
                    file=None,
                    thumbnail=None,
                    caption=f'Test image {i}',
                    order=i
                )
            print('Media items created successfully!')
        else:
            print('Media items not created - development mode only')
    else:
        print('Media items already exist')

    print(f'Project has {project.media.count()} media items')


if __name__ == "__main__":
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
    django.setup()
    create_test_project()
