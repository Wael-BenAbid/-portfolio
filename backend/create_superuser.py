"""
Script to create a superuser from environment variables
IMPORTANT: Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables before running
"""
import os
import sys
import django
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
django.setup()

from api.models import CustomUser
from django.contrib.auth.password_validation import validate_password

# ✅ Get credentials from environment variables
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

# ✅ Validate environment variables are set
if not ADMIN_EMAIL or not ADMIN_PASSWORD:
    print("❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required!")
    print("\nUsage:")
    print("  export ADMIN_EMAIL=youremail@example.com")
    print("  export ADMIN_PASSWORD=your-secure-password")
    print("  python create_superuser.py")
    print("\n📝 Password requirements:")
    print("  - At least 8 characters")
    print("  - Mix of letters, numbers, and symbols")
    print("  - Not just numbers")
    print("  - Not common passwords")
    sys.exit(1)

# ✅ Validate password strength
try:
    validate_password(ADMIN_PASSWORD)
except Exception as e:
    print(f"❌ Password validation failed: {e}")
    sys.exit(1)

# ✅ Create superuser if it doesn't exist
if not CustomUser.objects.filter(email=ADMIN_EMAIL).exists():
    try:
        user = CustomUser.objects.create_superuser(
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            user_type='admin'
        )
        print(f"✅ Superuser created successfully!")
        print(f"   Email: {user.email}")
        print(f"   User Type: {user.user_type}")
        print(f"\n🔐 Keep these credentials secure!")
    except Exception as e:
        print(f"❌ Error creating superuser: {e}")
        sys.exit(1)
else:
    print(f"ℹ️  Admin user '{ADMIN_EMAIL}' already exists")
    print("   To reset password, update ADMIN_PASSWORD and run:")
    print(f"   python manage.py shell")
    print(f"   >>> from api.models import CustomUser")
    print(f"   >>> user = CustomUser.objects.get(email='{ADMIN_EMAIL}')")
    print(f"   >>> user.set_password('new-password')")
    print(f"   >>> user.save()")
