# CORS Configuration Fix

## Problem
Frontend at `https://wael-ben-abid.me` (Vercel) cannot fetch from backend at `https://portfolio-4kcq.onrender.com` (Render) due to CORS policy error.

## Root Cause
The Render backend deployment may not have the latest CORS configuration or the CorsMiddleware isn't processing requests correctly.

## Solution

### Step 1: Verify Environment Variables on Render Dashboard
Go to: https://dashboard.render.com/services/srv-d6ns9l6a2pns73focuhg

Confirm these environment variables are set:
```
CORS_ALLOWED_ORIGINS = https://wael-ben-abid.me,https://www.wael-ben-abid.me
CSRF_TRUSTED_ORIGINS = https://wael-ben-abid.me,https://www.wael-ben-abid.me,https://portfolio-4kcq.onrender.com
```

### Step 2: Manual Redeploy on Render
1. Go to your Render service: https://dashboard.render.com/services/srv-d6ns9l6a2pns73focuhg
2. Click "Manual Deploy" button
3. Wait for the build to complete (3-5 minutes)
4. Test the API: Open DevTools on https://wael-ben-abid.me and check if requests to API succeed

### Step 3: Verify CORS Headers
After redeploy, test with curl:
```bash
curl -H "Origin: https://wael-ben-abid.me" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://portfolio-4kcq.onrender.com/api/projects/ \
  -v
```

Should see headers like:
```
Access-Control-Allow-Origin: https://wael-ben-abid.me
Access-Control-Allow-Methods: GET, POST, OPTIONS, ...
Access-Control-Allow-Credentials: true
```

## Backend CORS Configuration

### Files involved:
- `backend/portfolio/settings/base.py` - Base CORS config (line 138)
- `backend/portfolio/settings/prod.py` - Production CORS (line 22)
- `render.yaml` - Environment variables for Render

### Current Configuration:
✅ CorsMiddleware is enabled and positioned correctly (line 58 in base.py)
✅ CORS_ALLOW_CREDENTIALS = True
✅ render.yaml has correct CORS_ALLOWED_ORIGINS variable
✅ django-cors-headers app is installed

## If Problem Persists

Try adding these additional environment variables in Render dashboard:
```
CORS_ALLOW_ALL_ORIGINS = False
DEBUG = False
```

Or enable debug logging to see CORS validation:
```
python manage.py runserver --settings=portfolio.settings.prod
```

Check logs in Render dashboard for any CORS-related warnings.
