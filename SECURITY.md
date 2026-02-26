# 🛡️ Sécurité - Guide Complet

## 📋 Résumé Exécutif

Votre projet portfolio a une **excellente base de sécurité** avec :
- ✅ Protection CSRF robuste
- ✅ Authentification par tokens HttpOnly
- ✅ Protection contre InjectionSQL (ORM Django)
- ✅ Protection XSS (React + Headers)
- ✅ Rate limiting
- ✅ Password hashing sécurisé

**Quelques améliorations** ont été apportées pour la production.

---

## 🔒 Architecture de Sécurité

### 1. AUTHENTIFICATION

**Mécanisme :**

```
Frontend (navigateur)
    ↓
POST /api/auth/register/  (5 tentatives/min)
    ↓
Django valide + hache le mot de passe
    ↓
Crée un token
    ↓
Retourne le token dans un cookie HttpOnly
    ↓
Frontend stocke automatiquement (pas accessible via JavaScript)
```

**Technologies :**
- Token-based authentication (DRF)
- HttpOnly cookies (protection XSS)
- Secure flag (HTTPS seulement)
- SameSite=Lax (protection CSRF)
- Rate limiting (brute force)

**Validation des mots de passe :**

```python
- Minimum 8 caractères
- Pas seulement des chiffres
- Pas similaires à l'email
- Pas dans la liste de mots de passe communs
```

### 2. PROTECTION CONTRE LES ATTAQUES

| Attaque | Protection | Mécanisme |
|---------|-----------|----------|
| **SQL Injection** | ✅ ORM Django | Toutes les requêtes échappées automatiquement |
| **XSS** | ✅ React + Headers | React échappe les données + X-XSS-Protection |
| **CSRF** | ✅ CSRF tokens | Django middleware + SameSite cookies |
| **Brute Force** | ✅ Rate limiting | 5/min register, 10/min login |
| **Session Hijacking** | ✅ HttpOnly + Secure | Tokens non accessibles au JavaScript |
| **CORS** | ✅ Whitelist | Accepte seulement les origines configurées |
| **XXE** | ✅ Désactivé | JSON seulement (pas d'XML) |
| **Deserialization** | ✅ Zod validation | Validation stricte des données |

### 3. HEADERS DE SÉCURITÉ (Production)

```
Strict-Transport-Security: max-age=31536000  → Force HTTPS 1 an
X-Frame-Options: DENY                        → Empêche clickjacking
X-Content-Type-Options: nosniff              → Empêche MIME sniffing
X-XSS-Protection: 1; mode=block              → Protection XSS
Content-Security-Policy: (peut être ajouté)  → Contrôle les ressources chargées
```

### 4. PERMISSIONS & AUTORISATION

**Modèle Permission :**
```python
- Admin          : Accès complet à toutes les ressources
- Registered     : Peut créer/modifier ses propres ressources
- Visitor        : Accès en lecture seulement
```

**Exemples :**
```python
# ✅ Seulement authentifiés
class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

# ✅ Admin seulement
if request.user.user_type != 'admin':
    return Response({'error': 'Only admins...'}, status=403)

# ✅ Public pour lire, authentifiés pour modifier
class ProjectListCreate(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
```

---

## ⚙️ Configuration Production Requise

### 1. Variables d'Environnement Critiques

```env
# OBLIGATOIRE
DJANGO_SECRET_KEY=<clé très longue et aléatoire>
DJANGO_DEBUG=false
DB_PASSWORD=<mot de passe très fort>

# Recommandé
DJANGO_ALLOWED_HOSTS=portfolio.com,www.portfolio.com
CORS_ALLOWED_ORIGINS=https://portfolio.com,https://www.portfolio.com
CSRF_TRUSTED_ORIGINS=https://portfolio.com,https://www.portfolio.com
```

### 2. HTTPS Obligatoire

```python
# En production (automatique avec SECURE_SSL_REDIRECT=True)
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### 3. Base de Données

```sql
-- PostgreSQL (sécurisé par rapport à SQLite)
CREATE USER portfolio_user WITH PASSWORD 'mot-de-passe-fort';
CREATE DATABASE portfolio_db OWNER portfolio_user;
REVOKE CONNECT ON DATABASE portfolio_db FROM public;
```

### 4. Redis (Cache)

```bash
# Sécuriser Redis
redis-cli CONFIG SET requirepass "mot-de-passe-fort"

# Ou utiliser Redis en production (AWS ElastiCache, etc.)
REDIS_URL=redis://:password@redis-host:6379/1
```

---

## 🚀 Checklist Déploiement Production

### Avant Deployment

- [ ] ✅ `DJANGO_DEBUG=false`
- [ ] ✅ `DJANGO_SECRET_KEY` défini et fort (> 50 caractères)
- [ ] ✅ `DB_PASSWORD` défini et fort
- [ ] ✅ `CORS_ALLOWED_ORIGINS` spécifié exactement
- [ ] ✅ `CSRF_TRUSTED_ORIGINS` spécifié exactement
- [ ] ✅ HTTPS activé sur le domaine
- [ ] ✅ Certificat SSL valide
- [ ] ✅ `.env` ajouté à `.gitignore` (jamais committer)
- [ ] ✅ Logs des erreurs configurés (sans données sensibles)
- [ ] ✅ Backups configurés
- [ ] ✅ WAF (Web Application Firewall) activé (optionnel mais recommandé)

### Tests de Sécurité

```bash
# 1. Vérifier les vulnérabilités des dépendances
pip install safety
safety check

# 2. Analyser le code Python
pip install bandit
bandit -r backend/

# 3. Détecter les secrets hardcodés
pip install detect-secrets
detect-secrets scan

# 4. Vérifier les headers de sécurité
curl -I https://portfolio.com
# Vérifier:
# - Strict-Transport-Security
# - X-Frame-Options
# - X-Content-Type-Options
# - X-XSS-Protection

# 5. Scanner de sécurité SSL
# https://www.ssllabs.com/ssltest/

# 6. Test de pénétration OWASP
# https://owasp.org/www-project-top-ten/
```

---

## 🔍 Audit de Sécurité Régulier

### Script d'Audit Automatisé

```bash
# Exécuter l'audit de sécurité
python security_audit.py
```

### Audit Manuel Mensuel

```bash
# 1. Vérifier les versions des dépendances
pip list | grep -i django

# 2. Vérifier les logs de sécurité
tail -f backend/logs/django.log | grep "ERROR"

# 3. Vérifier les tentatives de brute force
grep "rate_limit_exceeded" backend/logs/django.log

# 4. Vérifier les accès non autorisés
grep "403\|401" backend/logs/django.log

# 5. Audit des bases de données
# Vérifier les permissions utilisateurs
# Vérifier les accès anormaux
```

---

## 📚 Ressources de Sécurité

### OWASP Top 10 2021

1. **Broken Access Control** → ✅ Permissions strictes implémentées
2. **Cryptographic Failures** → ✅ HTTPS + password hashing
3. **Injection** → ✅ ORM Django protège
4. **Insecure Design** → ✅ Architecture sécurisée
5. **Security Misconfiguration** → ✅ Configuration guidée
6. **Vulnerable & Outdated Components** → ⚠️ Mettre à jour régulièrement
7. **Authentication Failures** → ✅ Token + MFA possible
8. **Software & Data Integrity Failures** → ✅ Dépendances vérifiées
9. **Logging & Monitoring Failures** → ✅ Logging implémenté
10. **SSRF** → ✅ Non applicable (pas de requêtes sortantes sensibles)

### Bonnes Pratiques

- 🔄 **Mises à jour régulières** : Python, Django, dépendances mensuellement
- 🔑 **Rotation des secrets** : Tous les 90 jours
- 📊 **Monitoring** : Surveiller les logs pour les tentatives suspectes
- 🛡️ **Backups** : Quotidiens avec test de restauration hebdomadaires
- 📝 **Documentation** : Maintenir une documentation des incidents
- 🚨 **Incident Response** : Plan d'action en cas de fuite

---

## 🆘 Rapporter une Vulnérabilité

Si vous découvrez une vulnérabilité de sécurité :

1. **NE PAS** la signaler publiquement
2. Envoyer un email à : `security@portfolio.com`
3. Inclure :
   - Description détaillée
   - Impact potentiel
   - Étapes pour reproduire
   - Suggestions de correction (optionnel)

---

## 📞 Support Sécurité

Pour des questions de sécurité supplémentaires :

- 📖 [OWASP Django Security](https://owasp.org/www-community/attacks/)
- 📖 [Django Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- 📖 [DRF Token Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- 💬 [Bug Bounty](https://www.bugcrowd.com/)

---

## Dernière Mise à Jour

**Date:** 2026-02-24  
**Version:** 1.0  
**Niveau de Sécurité:** Production-Ready ✅

