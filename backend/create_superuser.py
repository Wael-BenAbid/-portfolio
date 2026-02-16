"""
Script to create a superuser with a default password
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
django.setup()

from api.models import CustomUser

# Create superuser if it doesn't exist
if not CustomUser.objects.filter(email='admin@portfolio.com').exists():
    user = CustomUser.objects.create_superuser(
        email='admin@portfolio.com',
        password='admin123',
        user_type='admin'
    )
    print(f"Superuser created: {user.email}")
else:
    print("Superuser 'admin@portfolio.com' already exists")
