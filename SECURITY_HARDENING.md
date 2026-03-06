# Security Hardening Implementation Guide

## Overview
This document details all security improvements implemented in Phase 2 of the project refactoring.

## 1. New Security Module (`api/security.py`)

### InputValidator Class
Provides comprehensive input validation and sanitization:

```python
# Email validation
InputValidator.validate_email('user@example.com')  # Returns: bool

# URL validation
InputValidator.validate_url('https://example.com')  # Returns: bool

# String sanitization (removes null bytes, saves whitespace, truncates)
InputValidator.sanitize_string(user_input, max_length=500)

# Password strength validation
is_strong, message = InputValidator.validate_password_strength(password)
```

**Features:**
- Email RFC 5322 simplified validation
- URL format validation
- Null byte removal (SQL injection prevention)
- Whitespace trimming
- Length truncation

### OriginValidator Class
Safely validates CORS origins and prevents subdomain bypass attacks:

```python
# Validate CORS origin
OriginValidator.validate_cors_origin('http://example.com')

# Get trusted origins
origins = OriginValidator.get_trusted_origins()
```

**Features:**
- Exact origin matching
- Prevents wildcard domain abuse
- Logs invalid origins for monitoring

### OAuthSecurityManager Class
Manages OAuth security with fail-closed approaches:

```python
# Get OAuth client ID (returns None if not configured)
client_id = OAuthSecurityManager.get_oauth_client_id('google')

# Validate OAuth provider is configured
OAuthSecurityManager.validate_oauth_provider('google')
```

**Features:**
- Fails closed if provider not configured
- Client ID validation required
- No default bypass for missing credentials

### AuditLogger Class
Comprehensive audit logging for compliance:

```python
# Authentication events
AuditLogger.log_auth_event('login', user=user, ip_address='192.168.1.1')

# Admin actions
AuditLogger.log_admin_action('user_deleted', admin_user, target_user=user)

# Security events
AuditLogger.log_security_event('failed_csrf', 'high', {'reason': 'origin_mismatch'})
```

**Features:**
- Separate audit log file (`logs/audit.log`)
- Timestamp tracking
- User ID logging (without storing passwords)
- IP address tracking
- Severity levels (low, medium, high, critical)
- No sensitive data in logs

### Response Builders
Safe response formatting:

```python
# Error response (never includes stack traces)
create_error_response(
    message="Invalid credentials",
    code="INVALID_CREDENTIALS",
    status_code=400
)

# Success response
create_success_response(
    data={'user_id': 123},
    message="User created successfully"
)
```

## 2. Enhanced OAuth Security

### Improvements:
1. **Client ID Validation Required** - OAuth verification fails closed if client ID not configured
2. **Token Verification** - Both Google and Facebook tokens verified against provider
3. **Secure Parameter Passing** - Uses `requests` params instead of URL interpolation (prevents injection)
4. **Timeout Protection** - 5-second timeout on OAuth verification requests
5. **Token Audit Logging** - All OAuth verification attempts logged

### Configuration Required:
```bash
GOOGLE_OAUTH2_CLIENT_ID=your_client_id
GOOGLE_OAUTH2_CLIENT_SECRET=your_secret
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

## 3. Improved Rate Limiting

### Rate limits now applied to:
- 🔒 **Login**: 10/minute (prevents brute force)
- 🔒 **Register**: 5/minute (prevents account enumeration)
- 🔒 **Password Change**: 5/minute (prevents abuse)
- 🔒 **Project Create**: 100/hour (configurable)
- 🔒 **Project Update**: 50/hour (configurable)
- 🔒 **Project Delete**: 20/hour (configurable)

### Usage:
```bash
# Configure via environment variables
PROJECT_CREATE_RATE_LIMIT=100/h
PROJECT_UPDATE_RATE_LIMIT=50/h
PROJECT_DELETE_RATE_LIMIT=20/h
```

## 4. Enhanced Logging

### Log Files Created:
- `logs/django.log` - Application logs
- `logs/audit.log` - Authentication and admin actions
- `logs/security.log` - Security events and warnings

### Log Rotation:
- Max 10MB per file
- 10 backup files for regular logs
- 20 backup files for audit logs

### Structured Logging:
- Timestamp tracking
- Module tracking
- Process/thread IDs
- Formatted for analysis

## 5. Error Handling Security

### Before:
```python
# ❌ Exposed sensitive details
try:
    user = User.objects.get(email=email)
except User.DoesNotExist:
    logger.error(f"User not found: {email}")  # Enumerates users!
```

### After (Timing Attack Prevention):
```python
# ✅ Same error message regardless
user = User.objects.filter(email=email).first()
if not user or not user.check_password(password):
    return Response(
        {'error': 'Invalid email or password.'},
        status=400
    )  # Attacker can't tell if email exists!
```

## 6. CORS Configuration

### Best Practices Implemented:
- **Whitelist-based**: Only specified origins accepted
- **No Wildcards**: Prevents overly permissive configs
- **SameSite Cookies**: Set to 'Lax' (prevents CSRF)
- **HTTPS Only**: Secure flag in production
- **HSTS Headers**: 1 year preload in production

### Configuration:
```bash
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://example.com
```

## 7. Password Security

### Enhanced Validation:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one digit
- ✅ At least one special character (!@#$%^&*()_+=-) 

### Hashing:
- Uses Django's PBKDF2 by default
- Configurable to bcrypt or Argon2 if preferred

## 8. Database Security

### Query Parameterization:
All queries use Django ORM (no raw SQL):
```python
# ✅ Safe - parameterized
users = User.objects.filter(email=email)

# ❌ Never do this
User.objects.raw(f"SELECT * FROM users WHERE email = '{email}'")
```

### Connection Security:
- Uses psycopg2-binary (PostgreSQL driver)
- Connection pooling support
- SSL connection option available

## 9. Sentry Integration

### Auto-Report Errors:
```bash
# Enable in production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Features:
- Real-time error tracking
- PII filtering (no password, email collection)
- 10% transaction sampling (configurable)
- Excludes health check endpoints

## 10. Security Checklist

Before deploying to production:

- [ ] Set `DJANGO_DEBUG=False` in production
- [ ] Configure `DJANGO_SECRET_KEY` (random, 50+ chars)
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Configure OAuth credentials
- [ ] Set `CSRF_TRUSTED_ORIGINS` correctly
- [ ] Enable HTTPS/TLS
- [ ] Configure Sentry DSN
- [ ] Set strong database password
- [ ] Enable rate limiting on all API endpoints
- [ ] Review and configure CORS origins
- [ ] Set up log monitoring
- [ ] Configure email service
- [ ] Run security audit: `bandit -r backend/`
- [ ] Run dependency check: `safety check`

## 11. Monitoring & Alerting

### Key Metrics to Monitor:
1. **Failed Login Attempts** - Alert if > 10 in 5 minutes per IP
2. **Security Events** - All HIGH/CRITICAL events to Sentry
3. **Rate Limit Violations** - Track persistent abusers
4. **OAuth Failures** - Monitor token verification failures
5. **Audit Log Entries** - Admin actions logged and monitored

### Dashboard Setup:
1. Create Grafana dashboard for audit logs
2. Set up alerts in Sentry
3. Configure log aggregation (ELK/Loki)

## 12. Testing Security

### Automated Security Tests:
```bash
# Run Bandit (Python security scanner)
bandit -r backend/

# Run Safety (dependency vulnerability check)
safety check

# Run Tests with Security Focus
pytest -m auth api/test_auth.py -v
```

### Manual Security Testing:
1. Test rate limiting with multiple requests
2. Test CSRF protection with curl
3. Test OAuth token validation with invalid tokens
4. Test SQL injection attempts
5. Test XSS payloads in inputs

## 13. Future Enhancements

### Phase 3 (Security):
- [ ] Add 2FA/MFA support
- [ ] Implement JWT tokens with rotation
- [ ] Add API key management for services
- [ ] Implement permission-based access control (RBAC)
- [ ] Add encryption for sensitive fields
- [ ] Implement audit log archival

### Phase 4 (Compliance):
- [ ] GDPR compliance (data export, deletion)
- [ ] HIPAA compliance (if handling health data)
- [ ] SOC 2 compliance
- [ ] Regular penetration testing
- [ ] Bug bounty program

## Questions & Troubleshooting

### Q: Logging is too verbose
A: Adjust `DJANGO_LOG_LEVEL` environment variable:
```bash
DJANGO_LOG_LEVEL=WARNING  # Less verbose
```

### Q: Audit logs using too much disk space
A: Adjust rotation settings in `settings.py`:
```python
'maxBytes': 1024 * 1024 * 5,  # 5MB instead of 10MB
'backupCount': 5,  # Keep fewer backups
```

### Q: OAuth verification failing
A: Check logs:
```bash
grep "oauth_verification_failed" logs/audit.log
# Then verify:
# 1. Client ID configured correctly
# 2. Token not expired
# 3. OAuth provider credentials correct
```

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [DRF Security](https://www.django-rest-framework.org/topics/security/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
