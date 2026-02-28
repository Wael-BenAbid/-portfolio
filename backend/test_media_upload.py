"""
Test script to verify media upload functionality
"""
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
import django
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from projects.models import Project, MediaItem
from PIL import Image
import io

def create_test_image():
    """Create a simple test image in memory"""
    img = Image.new('RGB', (1920, 1080), color='blue')
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG', quality=95)
    img_io.seek(0)
    return SimpleUploadedFile(
        "test_image.jpg",
        img_io.read(),
        content_type="image/jpeg"
    )

def test_media_upload():
    """Test uploading media to a project"""
    print("=" * 60)
    print("Testing Media Upload Functionality")
    print("=" * 60)
    
    # Get the first project
    project = Project.objects.first()
    if not project:
        print("[ERROR] No project found. Please create a project first.")
        return False
    
    print(f"\n[OK] Found project: {project.title}")
    
    # Create a test image
    test_image = create_test_image()
    print(f"[OK] Created test image (size: {len(test_image)} bytes)")
    
    # Create a media item with the uploaded file
    media_item = MediaItem.objects.create(
        project=project,
        media_type='image',
        file=test_image,
        caption='Test high-resolution image',
        order=1
    )
    
    print(f"[OK] Created media item with ID: {media_item.id}")
    print(f"  - Media type: {media_item.media_type}")
    print(f"  - Caption: {media_item.caption}")
    print(f"  - File path: {media_item.file.name}")
    print(f"  - File URL: {media_item.url}")
    
    # Verify the file exists
    if media_item.file and media_item.file.storage.exists(media_item.file.name):
        print(f"[OK] File exists in storage")
        file_size = media_item.file.size
        print(f"  - File size: {file_size} bytes ({file_size / 1024:.2f} KB)")
    else:
        print(f"[ERROR] File not found in storage")
        return False
    
    # Test the URL property
    if media_item.url:
        print(f"[OK] URL property works: {media_item.url}")
    else:
        print(f"[ERROR] URL property returned None")
        return False
    
    # Test serializer
    from projects.serializers import MediaItemSerializer
    from rest_framework.test import APIRequestFactory
    from django.conf import settings
    
    factory = APIRequestFactory()
    request = factory.get('/', HTTP_HOST='localhost')
    serializer = MediaItemSerializer(media_item, context={'request': request})
    
    print(f"\n[OK] Serializer output:")
    for key, value in serializer.data.items():
        print(f"  - {key}: {value}")
    
    # Verify the serializer includes the URL
    if serializer.data.get('url'):
        print(f"\n[OK] Serializer includes URL: {serializer.data['url']}")
    else:
        print(f"\n[ERROR] Serializer URL is missing")
        return False
    
    print("\n" + "=" * 60)
    print("[SUCCESS] All tests passed!")
    print("=" * 60)
    print("\nYou can now:")
    print("1. Go to http://localhost:8000/admin/")
    print("2. Login with your admin credentials")
    print("3. Navigate to Projects and add media items with file uploads")
    print("4. View the project detail page to see the uploaded media")
    
    return True

if __name__ == '__main__':
    try:
        success = test_media_upload()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n[ERROR] Error during test: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)