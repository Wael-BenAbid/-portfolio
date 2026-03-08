# Quick Command Reference Guide

## Setup & Installation

### Initial Setup
```bash
# Clone repository
git clone https://github.com/Wael-BenAbid/portfolio-v1.git
cd portfolio-v1

# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# Install dependencies (if not using Docker)
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

### Docker Setup
```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Run migrations
docker exec portfolio_backend python manage.py migrate

# Create superuser
docker exec -it portfolio_backend python manage.py createsuperuser
```

---

## Development

### Running Services

```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Stop services
docker-compose down

# Rebuild after dependency changes
docker-compose build --no-cache
```

### Backend Development

```bash
# Enter Django shell
docker exec -it portfolio_backend python manage.py shell

# Run tests
docker exec portfolio_backend python manage.py test

# Run tests with coverage
docker exec portfolio_backend pytest --cov=api --cov-report=html

# Run specific test
docker exec portfolio_backend pytest api/tests/test_auth.py::LoginTest

# Check code style
docker exec portfolio_backend black --check backend/
docker exec portfolio_backend isort --check-only backend/
docker exec portfolio_backend flake8 backend/
```

### Frontend Development

```bash
# Run development server
docker-compose up frontend

# Build for production
docker exec portfolio_frontend npm run build

# Run tests
docker exec portfolio_frontend npm test

# Run tests with coverage
docker exec portfolio_frontend npm run test:coverage

# Lint code
docker exec portfolio_frontend npm run lint
```

---

## Security & Monitoring

### Security Checks

```bash
# Run Bandit (Python security scanner)
pip install bandit
bandit -r backend/ -ll

# Check dependencies for vulnerabilities
pip install safety
safety check

# Check Node dependencies
npm audit
npm audit fix

# Run OWASP Dependency Check
docker run --rm -v $(pwd):/src owasp/dependency-check /src
```

### View Logs

```bash
# Backend logs
docker logs -f portfolio_backend

# Frontend logs
docker logs -f portfolio_frontend

# Database logs
docker logs -f portfolio_db

# Redis logs
docker logs -f portfolio_redis

# Filter for errors
docker logs portfolio_backend | grep ERROR
docker logs portfolio_backend | grep CRITICAL
```

### Check Health

```bash
# Backend health
curl http://localhost:8000/health/

# Frontend health
curl http://localhost/health

# Check container status
docker ps
docker inspect portfolio_backend | grep -A 5 Health

# View container stats
docker stats
docker stats portfolio_backend
```

---

## Database Management

### Migrations

```bash
# Create new migration
docker exec portfolio_backend python manage.py makemigrations

# Apply migrations
docker exec portfolio_backend python manage.py migrate

# Show migration status
docker exec portfolio_backend python manage.py showmigrations

# Revert last migration
docker exec portfolio_backend python manage.py migrate api 0008

# Create empty migration
docker exec portfolio_backend python manage.py makemigrations --empty api --name migration_name
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it portfolio_db psql -U postgres -d portfolio_db

# Useful SQL commands
\dt          # List tables
\d table_name # Describe table
SELECT COUNT(*) FROM api_visitor;
SELECT * FROM auth_user LIMIT 10;

# Backup database
docker exec portfolio_db pg_dump -U postgres portfolio_db > backup.sql

# Restore database
docker exec -i portfolio_db psql -U postgres portfolio_db < backup.sql
```

---

## Administration

### Create Test Data

```bash
# Create admin user
docker exec -it portfolio_backend python manage.py createsuperuser

# Create test data
docker exec portfolio_backend python manage.py create_test_data

# Load fixtures
docker exec portfolio_backend python manage.py loaddata fixtures/initial_data.json
```

### Management Commands

```bash
# GDPR cleanup (delete expired visitor records)
docker exec portfolio_backend python manage.py cleanup_expired_visitors

# Clean expired OAuth tokens
docker exec portfolio_backend python manage.py cleanup_expired_oauth_states

# Clear cache
docker exec portfolio_backend python manage.py clear_cache

# Collect static files
docker exec portfolio_backend python manage.py collectstatic --noinput

# Reset database
docker exec portfolio_backend python manage.py flush
```

---

## Deployment

### Production Build & Deploy

```bash
# Set production environment variables
export DJANGO_DEBUG=false
export DJANGO_SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")

# Build production images
docker build -f backend/Dockerfile -t portfolio-backend:latest .
docker build -f frontend/Dockerfile.prod -t portfolio-frontend:latest .

# Push to registry (if using private registry)
docker tag portfolio-backend:latest registry.example.com/portfolio-backend:latest
docker push registry.example.com/portfolio-backend:latest

# Deploy using docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Or using Kubernetes
kubectl apply -f k8s/
```

### Rolling Updates

```bash
# Update single service without downtime
docker-compose pull backend
docker-compose up -d backend

# Verify health after update
watch curl http://localhost:8000/health/
```

---

## Git Workflow

### Before Committing

```bash
# Run all checks
docker exec portfolio_backend python manage.py check
docker exec portfolio_backend pytest --cov=api --cov-fail-under=70
docker exec portfolio_frontend npm test
docker exec portfolio_frontend npm run lint

# Format code
docker exec portfolio_backend black backend/
docker exec portfolio_backend isort backend/
docker exec portfolio_frontend npx prettier --write .
```

### Commit & Push

```bash
# Stage changes
git add .

# Commit
git commit -m "feat: add security monitoring"

# Push to origin
git push origin main

# Create pull request
gh pr create --title "Add security monitoring"
```

---

## Testing

### Run Full Test Suite

```bash
# Backend tests
docker exec portfolio_backend pytest

# Frontend tests
docker exec portfolio_frontend npm test

# Integration tests
docker-compose up --abort-on-container-exit

# With coverage report
docker exec portfolio_backend pytest --cov=api --cov-report=html
docker exec portfolio_frontend npm run test:coverage
```

### Test-Driven Development

```bash
# Watch mode
docker exec portfolio_backend pytest --watch

# Run specific test file
docker exec portfolio_backend pytest api/tests/test_auth.py -v

# Run with output
docker exec portfolio_backend pytest -s -v api/tests/

# Run slow tests
docker exec portfolio_backend pytest api/tests/ -m slow
```

---

## Monitoring & Alerts

### Sentry

```bash
# Test Sentry integration
docker exec portfolio_backend python manage.py shell
>>> import sentry_sdk
>>> sentry_sdk.capture_message("Test error")

# View alerts in dashboard
# https://sentry.io/organizations/your-org/issues/
```

### Prometheus

```bash
# Access Prometheus
http://localhost:9090

# Export metrics
curl http://localhost:8000/metrics/

# Query specific metric
http://localhost:9090/api/v1/query?query=request_count
```

### Grafana

```bash
# Access Grafana
http://localhost:3000

# Default credentials: admin/admin

# Create custom dashboard
Data Sources → Prometheus → Create Dashboard
```

---

## Troubleshooting

### Container Issues

```bash
# Restart container
docker-compose restart backend

# Force recreate
docker-compose up -d --force-recreate backend

# Remove and recreate
docker-compose down
docker-compose up --build backend

# View resource usage
docker stats

# Check disk space
du -sh *
df -h
```

### Network Issues

```bash
# Check Docker network
docker network ls
docker network inspect portfolio-v1_default

# Test connectivity
docker exec portfolio_backend ping redis
docker exec portfolio_backend ping db

# Port conflicts
netstat -tlnp | grep 8000
lsof -i :8000
```

### Database Issues

```bash
# Check database connection
docker exec portfolio_backend python manage.py dbshell

# Reset database
docker-compose down -v  # Remove volumes
docker-compose up
docker exec portfolio_backend python manage.py migrate

# Backup before major changes
docker exec portfolio_db pg_dump -U postgres > backup_$(date +%Y%m%d).sql
```

### Memory Issues

```bash
# Check memory usage
docker stats

# Reduce worker processes
# In docker-compose.yml: --workers 2

# Increase available memory
# Docker Desktop: Preferences > Resources > Memory

# Clear cache and temp files
docker system prune
docker volume prune
```

---

## Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# Portfolio shortcuts
alias pdj='docker exec portfolio_backend python manage.py'
alias pdtest='docker exec portfolio_backend pytest'
alias pdfrontend='docker exec portfolio_frontend npm'
alias pdbash='docker exec -it portfolio_backend bash'
alias pdbdbsh='docker exec -it portfolio_db psql -U postgres'
alias pdlogs='docker-compose logs -f'
alias pdup='docker-compose up -d'
alias pddown='docker-compose down'
alias pdreset='docker-compose down -v && docker-compose up -d'
```

Usage:
```bash
pdj migrate
pdtest
pdlogs backend
pdup
```

---

## Performance Tuning

### Django Optimization

```python
# In settings.py
CONN_MAX_AGE = 600  # Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 600

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://localhost:6379/0',
        'TIMEOUT': 300,
    }
}
```

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_visitor_date ON api_visitor(visit_time);
CREATE INDEX idx_user_email ON auth_user(email);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM api_visitor WHERE visit_time > NOW() - INTERVAL '7 days';
```

### Frontend Optimization

```bash
# Check bundle size
docker exec portfolio_frontend npm run build
# Check dist/ size

# Create source map
docker exec portfolio_frontend npm run build -- --sourcemap

# Analyze bundle
docker exec portfolio_frontend npm run analyze
```

---

## Useful Links

- Sentry Dashboard: https://sentry.io/
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Admin Panel: http://localhost:8000/admin
- API Docs: http://localhost:8000/api/schema/swagger/
- Frontend: http://localhost:5173 (dev) / http://localhost (prod)

---

**Last Updated:** March 8, 2026
