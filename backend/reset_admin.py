"""
Script to reset admin access for waelbenabid1@gmail.com
"""
import os
import sys
import django
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Configuration de la base de données pour utiliser PostgreSQL avec 127.0.0.1
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
os.environ['DJANGO_DEBUG'] = 'False'
os.environ['DB_HOST'] = '127.0.0.1'  # Utiliser l'adresse IP directement
os.environ['DB_PORT'] = '5433'

django.setup()

from api.models import CustomUser

ADMIN_EMAIL = 'waelbenabid1@gmail.com'
ADMIN_PASSWORD = 'admin12345'  # Vous pouvez modifier ce mot de passe après connexion

print("Recherche de l'utilisateur admin:", ADMIN_EMAIL)

try:
    # Vérifier si l'utilisateur existe déjà
    user = CustomUser.objects.get(email=ADMIN_EMAIL)
    print("Utilisateur trouvé! Mise à jour des permissions et du mot de passe...")
    
    # Mettre à jour les permissions
    user.is_staff = True
    user.is_superuser = True
    user.user_type = 'admin'
    user.set_password(ADMIN_PASSWORD)
    user.save()
    
    print("Accès admin réinitialisé avec succès!")
    print("   Email:", user.email)
    print("   Mot de passe:", ADMIN_PASSWORD)
    print("   User Type:", user.user_type)
    print("   Staff:", user.is_staff)
    print("   Superuser:", user.is_superuser)
    
except CustomUser.DoesNotExist:
    print("Utilisateur non trouvé. Création d'un nouveau superuser...")
    
    try:
        user = CustomUser.objects.create_superuser(
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            user_type='admin'
        )
        print("Superuser créé avec succès!")
        print("   Email:", user.email)
        print("   Mot de passe:", ADMIN_PASSWORD)
        print("   User Type:", user.user_type)
    except Exception as e:
        print("Erreur lors de la création:", e)
        sys.exit(1)

except Exception as e:
    print("Erreur:", e)
    sys.exit(1)

print("\nImportant: Veuillez modifier le mot de passe après votre première connexion!")
