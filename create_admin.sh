#!/bin/bash
# 🔐 Script Sécurisé pour Créer un Admin
# Utilisation: ./create_admin.sh

echo "🔐 Création Sécurisée du Compte Admin"
echo "===================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "backend/create_superuser.py" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Demander l'email
echo "📧 Entrez l'email admin:"
read -p "Email: " ADMIN_EMAIL

# Valider l'email
if [[ ! "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo "❌ Email invalide"
    exit 1
fi

# Demander le mot de passe
echo ""
echo "🔐 Entrez un mot de passe sécurisé:"
echo "   (au moins 8 caractères, mélange de lettres/chiffres/symboles)"
read -sp "Mot de passe: " ADMIN_PASSWORD
echo ""
read -sp "Confirmez le mot de passe: " ADMIN_PASSWORD_CONFIRM
echo ""

# Vérifier que les mots de passe correspondent
if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
    echo "❌ Les mots de passe ne correspondent pas"
    exit 1
fi

# Exporter les variables d'environnement
export ADMIN_EMAIL
export ADMIN_PASSWORD

# Exécuter le script
echo ""
echo "⏳ Création de l'admin..."
cd backend
python create_superuser.py
EXIT_CODE=$?
cd ..

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Admin créé avec succès!"
    echo ""
    echo "📋 Identifiants:"
    echo "   Email: $ADMIN_EMAIL"
    echo "   Mot de passe: (sécurisé dans les variables d'environnement)"
    echo ""
    echo "🌐 Accédez à l'admin:"
    echo "   http://localhost:8000/admin/"
else
    echo ""
    echo "❌ Erreur lors de la création d'admin"
    exit 1
fi
