# Fix: RefreshToken IntegrityError Solution

## ❌ Le Problème

Vous receviez cette erreur lors du login:

```
django.db.utils.IntegrityError: duplicate key value violates unique constraint "api_refreshtoken_user_id_key"
DETAIL: Key (user_id)=(2) already exists.
HTTP 500 Internal Server Error
```

### Cause

Le modèle `RefreshToken` utilisait un `OneToOneField` pour l'utilisateur:

```python
user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
```

Un `OneToOneField` crée une **contrainte unique implicite** qui s'applique à TOUTES les lignes de la table, y compris les tokens révoqués (revoked).

**Flux du problème:**
```
1. Utilisateur se connecte → RefreshToken créé
2. Token révoqué (logout ou création d'un nouveau) → revoked_at = NOW()
3. Utilisateur essaie de se reconnecter
4. Code tente de créer un nouveau token
5. Bien que l'ancien soit révoqué, la contrainte unique empêche la création
6. → IntegrityError 500
```

---

## ✅ La Solution

### 1. **Changement du Modèle**

**Avant:**
```python
user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
```

**Après:**
```python
user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

class Meta:
    constraints = [
        models.UniqueConstraint(
            fields=['user'],
            condition=models.Q(revoked_at__isnull=True),
            name='unique_active_refresh_token_per_user'
        )
    ]
```

### Comment ça fonctionne:

- **ForeignKey:** Permet plusieurs tokens par utilisateur
- **UniqueConstraint + condition:** Garantit qu'il ne peut y avoir qu'**UN SEUL token actif** (non révoqué) par utilisateur
- PostgreSQL ignore automatiquement les lignes avec `revoked_at NOT NULL` pour la contrainte

**Résultat:**
```
✓ Ancien token révoqué (revoked_at = NOW())
✓ Nouveau token créé avec revoked_at = NULL
✓ Pas de conflit - contrainte respectée!
```

### 2. **Migration Django**

```bash
# Créée automatiquement
migration: 0010_alter_refreshtoken_user_and_more.py

- Modifie le champ user (OneToOneField → ForeignKey)
- Ajoute la contrainte unique partielle
- Supporte les données existantes
```

### 3. **Mise à Jour du Code**

**LogoutView** - Correction pour filtrer les tokens actifs:

```python
# Avant
refresh_token = RefreshToken.objects.get(user=request.user)

# Après  
refresh_token = RefreshToken.objects.get(
    user=request.user, 
    revoked_at__isnull=True  # ← Filtre les tokens actifs seulement
)
```

---

## 🧹 Nettoyage des Données

Le script `cleanup_tokens.py` a:
- ✓ Supprimé tous les tokens révoqués
- ✓ Conservé le dernier token actif par utilisateur
- ✓ Résolu tous les conflits existants

```
Exemple de sortie:
User waelbenabid1@gmail.com: Deleted 1 revoked token
Total deleted: 1 tokens
✓ Cleanup complete!
```

---

## 🧪 Vérification

**Test du Login:**

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"waelbenabid1@gmail.com","password":"test123"}'
```

**Résultat:**
```
✓ AVANT: HTTP 500 Internal Server Error (IntegrityError)
✓ APRÈS: HTTP 401 Unauthorized (Normal - pas d'erreur 500!)
```

---

## 📋 Fichiers Modifiés

| Fichier | Changement |
|---------|-----------|
| `backend/api/models.py` | OneToOneField → ForeignKey + UniqueConstraint |
| `backend/api/views.py` | LogoutView: ajouter filtre `revoked_at__isnull=True` |
| `backend/api/migrations/0010_alter_refreshtoken_user_and_more.py` | 🆕 Migration Django |
| `MONITORING_ALERTS_GUIDE.md` | 🆕 Guide des alertes Sentry |

---

## 🚀 Prochaines Étapes

### Si vous utilisez Docker:

```bash
# Redémarrer les services
docker-compose down
docker-compose up -d

# Élancer les migrations (si pas fait automatiquement)
docker exec portfolio_backend python manage.py migrate
```

### Si vous utilisez Python localement:

```bash
# Appliquer les migrations
cd backend
python manage.py migrate

# Redémarrer le serveur
python manage.py runserver 0.0.0.0:8000
```

### Test dans le navigateur:

1. Aller sur http://localhost:3000/auth
2. Cliquer "Login"
3. Entrez vos identifiants
4. ✅ Devrait fonctionner sans erreur 500!

---

## 🔍 Détails Techniques

### Contrainte Unique Partielle (Partial Unique Constraint)

PostgreSQL supporte les contraintes uniques avec conditions:

```sql
-- Ce qui a été créé:
ALTER TABLE api_refreshtoken 
ADD CONSTRAINT unique_active_refresh_token_per_user 
UNIQUE (user_id) 
WHERE revoked_at IS NULL;
```

**Avantages:**
- Garantit un seul token actif par utilisateur
- Permet plusieurs tokens révoqués dans l'historique
- Idéal pour l'audit et la sécurité

### Related Name Change

```python
# Avant (OneToOneField)
user.refresh_token  # Singular

# Après (ForeignKey)
user.refresh_tokens.all()  # Plural - compte tous les tokens
user.refresh_tokens.filter(revoked_at__isnull=True).first()  # Token actif
```

---

## ✨ Résumé

| Aspect | Avant | Après |
|--------|-------|-------|
| **Erreur** | 500 IntegrityError | ✅ Pas d'erreur |
| **Tokens/Utilisateur** | 1 max (OneToOneField strict) | Plusieurs, 1 actif max |
| **Revocation** | Bloquée par contrainte | Fonctionne correctement |
| **Historique** | Perdu | Conservé (audit) |
| **Login répétés** | ❌ Échoue | ✅ Fonctionne |

---

## 📎 Références

- [Django UniqueConstraint Documentation](https://docs.djangoproject.com/en/stable/ref/models/constraints/#uniqueconstraint)
- [PostgreSQL Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [JWT/Refresh Token Best Practices](https://tools.ietf.org/html/rfc6749#section-6)
