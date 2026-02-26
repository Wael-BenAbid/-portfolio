# 🔐 Script PowerShell pour Créer un Admin Sécurisé
# Utilisation: .\create_admin.ps1

Write-Host "🔐 Création Sécurisée du Compte Admin" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "backend/create_superuser.py")) {
    Write-Host "❌ Erreur: Exécutez ce script depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Demander l'email
Write-Host "📧 Entrez l'email admin:" -ForegroundColor Yellow
$ADMIN_EMAIL = Read-Host "Email"

# Valider l'email
$emailPattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
if ($ADMIN_EMAIL -notmatch $emailPattern) {
    Write-Host "❌ Email invalide" -ForegroundColor Red
    exit 1
}

# Demander le mot de passe
Write-Host ""
Write-Host "🔐 Entrez un mot de passe sécurisé:" -ForegroundColor Yellow
Write-Host "   (au moins 8 caractères, mélange de lettres/chiffres/symboles)" -ForegroundColor Gray
$securePassword = Read-Host -AsSecureString "Mot de passe"
$ADMIN_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($securePassword)
)

# Confirmer le mot de passe
$securePasswordConfirm = Read-Host -AsSecureString "Confirmez le mot de passe"
$ADMIN_PASSWORD_CONFIRM = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($securePasswordConfirm)
)

# Vérifier que les mots de passe correspondent
if ($ADMIN_PASSWORD -ne $ADMIN_PASSWORD_CONFIRM) {
    Write-Host "❌ Les mots de passe ne correspondent pas" -ForegroundColor Red
    exit 1
}

# Définir les variables d'environnement
$env:ADMIN_EMAIL = $ADMIN_EMAIL
$env:ADMIN_PASSWORD = $ADMIN_PASSWORD

# Exécuter le script
Write-Host ""
Write-Host "⏳ Création de l'admin..." -ForegroundColor Cyan
Push-Location backend
python create_superuser.py
$exitCode = $LASTEXITCODE
Pop-Location

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ Admin créé avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Identifiants:" -ForegroundColor Yellow
    Write-Host "   Email: $ADMIN_EMAIL" -ForegroundColor Cyan
    Write-Host "   Mot de passe: (sécurisé dans les variables d'environnement)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🌐 Accédez à l'admin:" -ForegroundColor Yellow
    Write-Host "   http://localhost:8000/admin/" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la création d'admin" -ForegroundColor Red
    exit 1
}
