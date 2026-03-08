# OAuth & Backend Configuration Fix Guide

## 🔴 Critical Issues Found

### Issue 1: Google OAuth 403 - "Origin Not Allowed"
**Error:** `The given origin is not allowed for the given client ID`
**Status:** ⚠️ **REQUIRES ACTION IN GOOGLE CLOUD CONSOLE**

Your frontend (localhost:5173) is not registered as an authorized origin in your Google OAuth app.

### Issue 2: COOP Policy Blocking postMessage
**Error:** `Cross-Origin-Opener-Policy policy would block the window.postMessage call`
**Status:** ✅ **FIXED** - Added SecurityHeadersMiddleware

### Issue 3: Intermittent Backend 500 Error
**Status:** ✅ **INVESTIGATED** - Endpoint works correctly when tested directly

---

## 🔧 Fixes Applied

### ✅ Backend Security Headers Added
Added `SecurityHeadersMiddleware` to handle:
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` - Allows OAuth popups
- Content security and XSS protection headers
- File: `/backend/api/middleware.py`

Registered in: `/backend/portfolio/settings.py`

---

## ⚠️ REQUIRED: Google Cloud Console Configuration

### Your Google OAuth Client ID:
```
64475552515-1agdo4tviffo2sit07v941un8kmuf6p0.apps.googleusercontent.com
```

### Step-by-Step Fix:

1. **Open Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Login with the account that owns the OAuth app

2. **Navigate to OAuth Credentials**
   - Click: **APIs & Services** in left sidebar
   - Click: **Credentials**
   - Find and click: **OAuth 2.0 Client ID (Web application)**
     - Should say "64475552515-..."

3. **Add Authorized JavaScript Origins**
   - Find section: **Authorized JavaScript origins**
   - Click: **+ ADD URI**
   - Add these origins:
     - `http://localhost:5173` ← **PRIMARY (Vite dev server)**
     - `http://127.0.0.1:5173`
     - `http://localhost:3000` ← **If you use different port**
   
4. **For Production** (later)
   - Add your production domain:
     - `https://yourdomain.com`
     - `https://www.yourdomain.com`

5. **Save Changes**
   - Click: **Save** button
   - Wait 1-2 minutes for changes to propagate
   - No code changes needed - Google caches this

### Frontend Environment Variables
```
# File: /frontend/.env.local
VITE_GOOGLE_OAUTH2_CLIENT_ID=64475552515-1agdo4tviffo2sit07v941un8kmuf6p0.apps.googleusercontent.com
```
✅ Already configured correctly

---

## 🧪 Testing the Fix

1. **Backend is running:**
   ```bash
   # Terminal output should show: "Starting development server at http://0.0.0.0:8000/"
   ```

2. **Frontend test:**
   - Go to: http://localhost:5173
   - Navigate to Sign In page
   - Google button should appear (after Google Console propagates ~1-2 min)
   - Click Google button → should NOT show 403 error

3. **Verify Security Headers:**
   ```bash
   # In terminal, run:
   curl -I http://localhost:8000/api/auth/login/
   
   # Should see these headers:
   # Cross-Origin-Opener-Policy: same-origin-allow-popups
   # X-Frame-Options: SAMEORIGIN
   # X-Content-Type-Options: nosniff
   ```

---

## 🔍 Troubleshooting

### "The given origin is not allowed" - Still seeing 403?
- [ ] Check you added the correct origins in Google Console
- [ ] Wait 2-3 minutes for Google to cache the change
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Try incognito/private browser window
- [ ] Verify frontend is actually running on localhost:5173
  - Not localhost:3000, not 127.0.0.1:3000, etc.

### "postMessage blocked by COOP policy" - Still seeing error?
- [ ] Restart backend: `python manage.py runserver`
- [ ] Clear browser cache
- [ ] Try different browser (Chrome, Firefox, Edge)
- [ ] Check Network tab shows `Cross-Origin-Opener-Policy: same-origin-allow-popups` header

### Google button doesn't appear even after origins added?
- [ ] Check browser console for **actual** error (beyond 403)
- [ ] Verify `VITE_GOOGLE_OAUTH2_CLIENT_ID` in `.env.local` matches your client ID
- [ ] Verify frontend `.env.local` file was loaded (restart dev server if changed)

---

## 📋 Files Modified

| File | Changes | Status |
|------|---------|--------|
| `/backend/api/middleware.py` | Added SecurityHeadersMiddleware class | ✅ Committed |
| `/backend/portfolio/settings.py` | Registered SecurityHeadersMiddleware | ✅ Committed |
| `/frontend/.env.local` | No changes needed (already correct) | ✅ OK |

---

## Next Steps

1. **Immediate (This session):**
   - ✅ Backend security headers added
   - ⏳ Configure Google Console (requires manual action)
   - ⏳ Test OAuth flow

2. **Follow-up:**
   - [ ] Update production domain in Google Console
   - [ ] Configure HTTPS certificates for production
   - [ ] Set up cron jobs for cleanup_expired_visitors and cleanup_expired_oauth_states

---

## 📞 Still Having Issues?

Check these resources:
1. [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
2. [Django CORS Configuration](https://github.com/adamchainz/django-cors-headers)
3. Backend logs: `tail -f backend/logs/*.log`

---

**Last Updated:** March 8, 2026
