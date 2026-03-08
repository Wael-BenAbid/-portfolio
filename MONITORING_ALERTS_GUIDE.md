# Guide Complet: Alertes & Monitoring du Site

## Table des Matières
1. [Recevoir les Alertes](#1-recevoir-les-alertes)
2. [Monitorer le Trafic](#2-monitorer-le-trafic)
3. [Contrôler & Analyser](#3-contrôler--analyser)
4. [Commandes Rapides](#4-commandes-rapides)

---

## 1. Recevoir les Alertes

### 1.1 Configuration de Base dans Sentry

**URL:** https://sentry.io

#### Étape 1: Créer deux projets
```
1. Aller sur https://sentry.io/auth/login/
2. Login avec votre compte
3. Créer 2 projets:
   - "Portfolio Backend" (Django/Python)  
   - "Portfolio Frontend" (JavaScript/React)
4. Récupérer les DSN (Data Source Name) de chaque projet
```

#### Étape 2: Configurer les DSN
```bash
# Dans .env
SENTRY_DSN=https://[key]@sentry.io/[project-id]
VITE_SENTRY_DSN=https://[key]@sentry.io/[project-id]

# Ou dans docker-compose.yml
environment:
  - SENTRY_DSN=https://[key]@sentry.io/[project-id]
  - VITE_SENTRY_DSN=https://[key]@sentry.io/[project-id]
```

#### Étape 3: Redémarrer les services
```bash
docker-compose down
docker-compose up -d
```

### 1.2 Types d'Alertes Automatiques

#### Backend (Django) - Alertes Automatiques
```
✅ Exceptions Python (erreurs, 500)
✅ Attaques SQL Injection → CRITICAL
✅ Attaques XSS → CRITICAL
✅ Path Traversal → HIGH
✅ Admin Probing → HIGH
✅ Configuration Exposure → MEDIUM
✅ Performance lente (>2s)
```

**Exemple d'alerte reçue:**
```
[CRITICAL] SQL Injection Detected
URL: POST /api/login/
Payload: admin' OR '1'='1
IP: 192.168.1.100
Timestamp: 2026-03-08 15:23:45
Action: Blocked - 403 Forbidden
```

#### Frontend (React) - Alertes Automatiques
```
✅ JavaScript Errors (console.error)
✅ Unhandled Promise Rejections
✅ Memory Leaks
✅ Performance Issues
✅ Session Replays
```

### 1.3 Configurer les Notifications d'Alerte

**Dans Sentry Dashboard:**

#### Pour Email:
```
1. Cliquer sur "Settings" (en haut à droite)
2. Aller à "Notifications" 
3. Activer "Email Alerts"
4. Sélectionner:
   ✅ Alerts for your organization
   ✅ Digest email (résumé quotidien)
4. Configurer les règles d'alerte:
   - HIGH & CRITICAL
   - Pour tous les projets
```

#### Pour Slack (Recommandé):
```
1. Aller à Integrations
2. Cliquer "Slack"
3. Autoriser l'accès
4. Sélectionner le canal: #security-alerts
5. Configurer les événements: HIGH, CRITICAL
```

#### Pour Microsoft Teams:
```
1. Aller à Integrations
2. Cliquer "Microsoft Teams"
3. Fournir le webhook URL
4. Configurer les seuils d'alerte
```

### 1.4 Règles d'Alerte Personnalisées

**Dans Project Settings > Alerts:**

#### Règle 1: Tous les Threats CRITICAL
```
When:
  - Event has tag "severity" equals "CRITICAL"
  - AND event has tag "threat_type" exists
  
Then:
  - Send email to security@yoursite.com
  - Send to Slack #security-alerts
  - Create Jira ticket
```

#### Règle 2: Attaques SQL Injection
```
When:
  - Exception message contains "SQL Injection"
  - AND level is "error" or "fatal"
  
Then:
  - Send immediate Slack notification
  - Page on-call engineer (PagerDuty)
```

#### Règle 3: Pic de Trafic Anormal
```
When:
  - Event count > 1000 in 5 minutes
  - Unique issues > 50
  
Then:
  - Send email to ops team
  - Trigger DDoS mitigation (si nécessaire)
```

---

## 2. Monitorer le Trafic

### 2.1 Dashboard Sentry - Vue d'Ensemble

**URL:** https://sentry.io > Your Organization > Select Project

```
DASHBOARD BACKEND:
├── Erreurs (dernières 24h)
├── Utilisateurs Affectés
├── Performances (temps réponse)
├── Tendances (crashing, errors)
├── Release Health (stabilité)
└── Issues (tous les problèmes)

DASHBOARD FRONTEND:
├── JavaScript Errors
├── Console.error/warn
├── Session Replays
├── Performance Metrics
└── User Feedback
```

### 2.2 Prometheus - Metrics en Temps Réel

**URL:** http://localhost:9090

#### Métriques Disponibles:
```
HTTP Request Count:
  - http_requests_total (par endpoint, méthode)
  - http_request_duration_seconds (latence)
  
Database:
  - db_connection_pool_size
  - db_query_duration_seconds
  
Application:
  - django_requests_total
  - django_request_latency_seconds
  
Security:
  - malicious_requests_blocked (attaques détectées)
  - rate_limit_violations (limites dépassées)
```

#### Exemples de Requêtes:
```promql
# Nombre total de requêtes
sum(http_requests_total)

# Attaques XSS bloquées
sum(malicious_requests_blocked{threat_type="XSS"})

# Requêtes lentes (>1s)
http_request_duration_seconds > 1

# Taux d'erreur (errors/total)
sum(http_requests_total{status="500"}) / sum(http_requests_total)
```

### 2.3 Grafana - Dashboard Visuel

**URL:** http://localhost:3000 (configurable)

#### Se Connecter:
```
Default:
  Username: admin
  Password: admin   # CHANGER en production!
```

#### Dashboards Pré-Configurés:

**1. Application Health**
```
✓ Requêtes par seconde
✓ Temps de réponse moyen
✓ Taux d'erreur (%)
✓ Utilisateurs actifs
✓ Requests par endpoint
```

**2. Security Monitoring**
```
✓ Attaques détectées (par type)
✓ IPs suspectes
✓ Rate limit violations
✓ Admin probe attempts
✓ Tendance d'attaques
```

**3. Performance**
```
✓ Database query time
✓ Cache hit rate
✓ Memory usage
✓ CPU usage
✓ Disk I/O
```

**4. User Activity**
```
✓ Utilisateurs connectés
✓ Pages visitées
✓ Actions utilisateur
✓ Bounce rate
✓ Session duration
```

### 2.4 Logs - Détails Complets

#### Backend Logs (Django):
```bash
# Voir les logs en temps réel
docker-compose logs -f backend

# Voir les logs avec filtre
docker-compose logs -f backend | grep "ERROR\|CRITICAL"

# Exporter les logs
docker-compose logs backend > backend.log
```

#### Format des Logs:
```
[2026-03-08 15:23:45] INFO [api.views] GET /api/projects/ - 200 OK - 125ms
[2026-03-08 15:24:12] WARNING [api.security] XSS detected in query param
[2026-03-08 15:24:13] CRITICAL [api.security] SQL Injection - BLOCKED - IP: 192.168.1.100
[2026-03-08 15:25:00] ERROR [api.models] Database connection timeout
```

#### Frontend Logs (Browser):
```javascript
// Ouvrir Console (F12 > Console)
// Tous les errors/warnings s'affichent
// Sentry capture automatiquement

// Ou dans Sentry Dashboard > Frontend Project
// Cliquer sur "Issues" pour voir tous les erreurs
```

---

## 3. Contrôler & Analyser

### 3.1 Analyser une Attaque

**Scénario:** Vous recevez une alerte SQL Injection

```
1. Aller sur https://sentry.io/projects/your-backend/
2. Cliquer sur l'issue "SQL Injection Detected"
3. Vous verrez:
   ├── Stack trace (où l'erreur s'est produite)
   ├── Request details (URL, méthode, payload)
   ├── User info (IP, navigateur, session)
   ├── Timeline (quand c'est arrivé)
   └── Breadcrumbs (les actions avant l'erreur)

4. Actions possibles:
   ├── Ignore (ignorer les prochaines alertes similaires)
   ├── Resolve (marquer comme résolu)
   ├── Assign to user (assigner à quelqu'un)
   └── Create issue (créer ticket GitHub/Jira)
```

### 3.2 Identifier un Attaquant

```bash
# Si vous avez l'IP de l'attaquant:

# 1. Voir tous les appels de cette IP
# Dans Prometheus:
http_requests_total{ip_address="192.168.1.100"}

# 2. Bloquer l'IP (gérer dans Django)
# Dans backend/api/security.py ou middleware

# 3. Voir les patterns d'attaque
# Dans Grafana > Security Dashboard
# Filtrer: source_ip = 192.168.1.100
```

### 3.3 Audit Trail Complet

**Sentry Archive:**
```
1. Settings > Organization
2. "Release Tracking" > Download all data
3. Export format: JSON/CSV
4. Contient: toutes les attaques, erreurs, trends
```

**Prometheus Retention:**
```
# Par défaut: 15 jours
# Modifier dans docker-compose.yml:

prometheus:
  environment:
    - PROMETHEUS_RETENTION=30d  # 30 jours
```

### 3.4 Rapport de Sécurité

**Générer automatiquement:**

#### Option 1: Sentry Reports
```
1. Settings > Billing & Plan
2. "Reports" section
3. Activer "Security Report"
4. Reçoive weekly/monthly email
```

#### Option 2: Script Python
```bash
# Créer un script dans backend/
# security_report.py

# Exécuter:
docker exec portfolio_backend python security_report.py

# Générer un PDF/CSV
```

---

## 4. Commandes Rapides

### 4.1 Démarrage & Logs

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f                    # Tous
docker-compose logs -f backend            # Backend seulement
docker-compose logs -f backend | grep ERROR

# Arrêter les services
docker-compose down
docker-compose down -v                    # Supprimer volumes
```

### 4.2 Accès aux Dashboards

```
🔗 Sentry (Erreurs & Alertes):      https://sentry.io
🔗 Prometheus (Metrics raw):        http://localhost:9090
🔗 Grafana (Dashboard visuel):      http://localhost:3000
🔗 Django Admin:                    http://localhost:8000/admin/
🔗 Frontend:                        http://localhost:5173 (dev)
🔗 API Backend:                     http://localhost:8000
```

### 4.3 Tester les Alertes

#### Tester Sentry Backend:
```bash
# Envoyer une exception
docker exec portfolio_backend python -c "
import sentry_sdk
sentry_sdk.capture_exception(Exception('Test alert from CLI'))
"
```

#### Tester Sentry Frontend:
```javascript
// Dans la console du navigateur (F12):
Sentry.captureException(new Error('Test frontend alert'))
```

#### Tester Detection d'Attaque:
```bash
# SQL Injection
curl "http://localhost:8000/api/login/?username=admin' OR '1'='1"

# XSS
curl "http://localhost:8000/api/search/?q=<script>alert(1)</script>"

# Rate Limiting (>100 requêtes rapidement)
for i in {1..150}; do
  curl http://localhost:8000/api/health/ &
done
wait
```

Vous devriez recevoir des alertes HIGH/CRITICAL dans Sentry.

### 4.4 Gérer les Alertes

```bash
# Silencer un type d'alerte:
# Dans backend/api/security.py

# Modifier le niveau de sévérité:
threat_level = "MEDIUM"  # Au lieu de "HIGH"

# Redéployer:
docker-compose build --no-cache
docker-compose up -d
```

---

## 5. Checklist de Setup

- [ ] Créer compte Sentry (https://sentry.io)
- [ ] Créer project Backend Django
- [ ] Créer project Frontend JavaScript  
- [ ] Récupérer DSN pour chaque projet
- [ ] Ajouter DSN dans `.env` ou `docker-compose.yml`
- [ ] Redémarrer services: `docker-compose up -d`
- [ ] Configurer notifications: Email/Slack/Teams
- [ ] Créer règles d'alerte personnalisées
- [ ] Tester avec les commandes curl
- [ ] Vérifier Prometheus sur http://localhost:9090
- [ ] Vérifier Grafana sur http://localhost:3000
- [ ] Recevoir test alert dans Slack

---

## 6. Résumé Rapide

| Besoin | Solution |
|--------|----------|
| **Recevoir alertes en temps réel** | → Sentry + Slack/Email |
| **Voir le trafic en direct** | → Grafana Dashboard + Prometheus |
| **Analyser une attaque** | → Sentry > Issues > Details |
| **Historique complet** | → Prometheus + Sentry Archive |
| **Bloquer un attaquant** | → IP Blacklist dans middleware |
| **Rapport de sécurité** | → Sentry Reports ou security_report.py |

---

## Support

Pour plus d'infos:
- Sentry Docs: https://docs.sentry.io/
- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/
