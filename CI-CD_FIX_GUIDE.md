# CI/CD PIPELINE FIX GUIDE

## Issues Identified

1. **Pytest execution not properly validated**
2. **Coverage threshold (70%) may be too high**
3. **No proper error handling in test results**
4. **Test artifacts not being saved for inspection**
5. **Frontend tests may fail silently**

---

## Quick Start - Run Tests Locally

### Backend Tests

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run tests with coverage
pytest --cov --cov-report=html --cov-report=term-missing -v

# View coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

**Expected Output:**
```
...
========================= test session starts ==========================
collected 45 items

api/tests.py::UserModelTest::test_create_user PASSED               [ 10%]
api/tests.py::UserModelTest::test_create_admin_user PASSED         [ 15%]
...
========================= 45 passed in 2.45s ===========================
========================= coverage ==========================
Name                      Stmts   Miss  Cover
────────────────────────────────────────────
api/__init__.py                0      0   100%
api/admin.py                 23      0   100%
...
TOTAL                       450     30    93%

coverage: platform linux -- Python 3.11.x
---
```

If you see `FAILED` tests:
1. Check the error message
2. Look at the specific test function
3. Debug locally with `-v` flag for verbose output

### Frontend Tests

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm ci

# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

---

## Common Test Failures & Fixes

### Issue 1: Database Connection Failed

**Error:**
```
django.db.utils.OperationalError: could not connect to server: Connection refused
```

**Fix:**
```bash
# Ensure PostgreSQL is running
# If using Docker:
docker-compose up -d postgres redis

# OR manually start PostgreSQL
pg_isready -h localhost -p 5432
```

### Issue 2: Migration-related Errors

**Error:**
```
django.db.utils.ProgrammingError: relation "api_customuser" does not exist
```

**Fix:**
```bash
cd backend
python manage.py migrate --settings=portfolio.settings
pytest
```

### Issue 3: Import Errors in Tests

**Error:**
```
ImportError: cannot import name 'SocialAuthSerializer' from 'api.serializers'
```

**Fix:**
1. Check if the class exists in the file
2. Check `__init__.py` exports
3. Verify file is saved (not edited in IDE)

### Issue 4: Cache/Redis Connection Issues

**Error:**
```
response = requests.get(...)
ConnectionError: Connection refused
```

**Fix:**
```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Or check environment variables
echo $REDIS_URL  # Should show connection string
```

### Issue 5: Tests Timeout

**Error:**
```
Timeout waiting for OAuth verification
```

**Fix:**
```python
# In test settings, set shorter timeout:
OAUTH_TIMEOUT = 1  # 1 second for tests

# Or mock the external call:
from unittest.mock import patch

@patch('api.serializers.OAuthSecurityManager.verify_oauth_token')
def test_social_auth(self, mock_verify):
    mock_verify.return_value = True
    # Run test
```

---

## Step-by-Step: Fix Failing Tests

### Step 1: Run Tests with Verbose Output

```bash
cd backend

# Run all tests with verbose output
pytest -v

# Run specific test file
pytest api/tests.py -v

# Run specific test class
pytest api/tests.py::AuthenticationTest -v

# Run specific test method
pytest api/tests.py::AuthenticationTest::test_user_login -v
```

### Step 2: Debug With Print Statements

```python
# In your test file or code
def test_user_login(self):
    print(f"DEBUG: About to test user login")
    response = self.client.post('/api/auth/login/', {...})
    print(f"DEBUG: Response status = {response.status_code}")
    print(f"DEBUG: Response data = {response.data}")
    self.assertEqual(response.status_code, 200)
```

Run with output capture disabled:
```bash
pytest -v -s  # -s flag shows print statements
```

### Step 3: Use pytest Flags for Debugging

```bash
# Stop on first failure
pytest -x

# Start debugger on test failure (requires pdb)
pytest --pdb -v

# Show local variables on failure
pytest -l -v

# Run only failed tests from last run
pytest --lf

# Run only failed tests (if any)
pytest --ff
```

---

## Coverage Threshold Issues

### Check Current Coverage

```bash
cd backend
pytest --cov --cov-report=term-missing

# Should show something like:
# TOTAL      450      30    93%   92-94,105,201

# 93% coverage is above the 70% threshold!
```

### If Coverage is Below 70%

1. **Identify uncovered lines:**
   ```bash
   pytest --cov --cov-report=html
   open htmlcov/index.html  # See which lines aren't tested
   ```

2. **Write tests for uncovered code:**
   ```python
   # Example: If line 105 in security.py is uncovered:
   def test_validate_email_invalid_format():
       assert InputValidator.validate_email("invalid") == False
       assert InputValidator.validate_email("user@") == False
   ```

3. **Lower threshold temporarily if needed:**
   ```ini
   # In pytest.ini
   [pytest]
   addopts = --cov-fail-under=70  # Change to lower value like 60
   ```

---

## CI/CD Pipeline Validation

### Test Locally Before Pushing

```bash
# Run backend tests
cd backend && pytest && cd ..

# Run frontend tests  
cd frontend && npm run test:coverage && cd ..

# If both pass, safe to push!
```

### Check CI/CD Pipeline Status

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix: Run tests with proper coverage"
   git push origin main
   ```

2. **Monitor Pipeline:**
   - Go to: `https://github.com/YOUR_USERNAME/portfolio-v1/actions`
   - Click on the latest workflow run
   - Watch real-time output
   - Check "test-backend" job for details

3. **View Test Artifacts:**
   - In GitHub Actions, scroll down to "Artifacts"
   - Download `pytest-results` and `frontend-coverage` folders
   - View local test reports

### Common CI/CD Failures

**❌ "Backend tests failed"**
1. Click the job name to see full log
2. Look for specific test name that failed
3. Run that test locally to debug
4. Fix and re-push

**❌ "Coverage below 70%"**
1. Download `pytest-results` artifact
2. Check which files lack coverage
3. Add tests for those files
4. Re-run locally to verify

**❌ "Docker build failed"**
1. Check if Dockerfile exists and is correct
2. Build locally: `docker build -f backend/Dockerfile -t portfolio-backend .`
3. Fix any issues
4. Push again

---

## Continuous Integration Best Practices

### Before Every Commit

```bash
# 1. Run all tests
cd backend && pytest && cd ..
cd frontend && npm test && cd ..

# 2. Check linting
cd backend && black --check . && isort --check . && flake8 . && cd ..
cd frontend && npm run lint && cd ..

# 3. Check types (if using TypeScript)
cd frontend && npx tsc --noEmit && cd ..

# 4. Only commit if ALL pass
git add .
git commit -m "feature: Add new feature"
git push
```

### Use Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Hooks run automatically before commit
# Or run manually
pre-commit run --all-files
```

### Monitor Test Trends

```bash
# Check if tests are getting slower
pytest --durations=10  # Show slowest 10 tests

# Optimize slow tests
# Profile with:
python -m pytest --profile
```

---

## Expected Results After Fix

### Backend
```
✅ 45 passed in 2.34s
✅ Coverage: 93%
✅ All models tested
✅ All views tested
✅ All serializers tested
```

### Frontend
```
✅ XX passed
✅ Coverage: XX%
✅ All components tested
✅ All hooks tested
✅ All utils tested
```

### CI/CD Pipeline
```
✅ test-backend: PASSED
✅ test-frontend: PASSED
✅ code-quality: PASSED
✅ build-docker: PASSED (on main branch)
```

---

## Debugging Production Issues

### If Tests Pass Locally But Fail in CI/CD

1. **Environment Differences:**
   ```bash
   # Check GitHub Actions environment
   echo "Python: $(python --version)"
   echo "Node: $(node --version)"
   echo "Database: postgres 15"
   echo "Redis: redis 7"
   
   # Ensure your local environment matches
   ```

2. **Database State:**
   - CI/CD creates fresh database for each run
   - Local database might have leftover data
   - Solution: Run migrations fresh
   ```bash
   cd backend
   python manage.py migrate --no-input
   python manage.py migrate zero  # Reverse all migrations
   python manage.py migrate  # Apply fresh
   pytest
   ```

3. **Cache Issues:**
   - CI/CD uses fresh Redis instance
   - Local cache might be stale
   - Clear cache between tests
   ```python
   # In conftest.py
   @pytest.fixture(autouse=True)
   def clear_cache():
       from django.core.cache import cache
       cache.clear()
       yield
       cache.clear()
   ```

---

## Next Steps

1. ✅ Fix the issues identified in this guide
2. ✅ Run tests locally and verify they pass
3. ✅ Push changes to trigger CI/CD
4. ✅ Monitor GitHub Actions for successful completion
5. ✅ Review test coverage report
6. ✅ Celebrate! 🎉

---

## Support

If you encounter issues:

1. **Check error message carefully** - It tells you exactly what's wrong
2. **Run locally first** - Easier to debug than in CI/CD
3. **Use verbose flags** - `-v`, `-s`, `--tb=short`
4. **Check GitHub Actions logs** - Full output available online
5. **Review this guide** - Most common issues are covered

Good luck! 🚀
