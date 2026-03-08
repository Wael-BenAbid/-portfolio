# 🔐 Google OAuth Configuration Guide - Secure Setup

## 📋 Current Configuration

**Your Google OAuth Credentials:**
```
Client ID: 64475552515-1agdo4tviffo2sit07v941un8kmuf6p0.apps.googleusercontent.com
Client Secret: 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
```

**Email for Notifications:**
```
Email: waelbenabid1@gmail.com
App Password: qcda ulgh gdhe gauo
```

---

## ❌ Current Error

```
403 Forbidden: The given origin is not allowed for the given client ID
GET https://accounts.google.com/gsi/status?client_id=64475552515-...
```

**Cause:** Your frontend origins (localhost:3000, localhost:5173) are NOT registered in Google Cloud Console.

---

## ✅ SOLUTION: Add Authorized Origins

### Step 1: Open Google Cloud Console

1. Go to: **https://console.cloud.google.com**
2. Click the **Select a Project** dropdown (top of page)
3. Select your project (or create one)

### Step 2: Navigate to OAuth 2.0 Configuration

1. Left sidebar → **APIs & Services**
2. Click **Credentials**
3. Under "OAuth 2.0 Client IDs", find your Web Client ID: `64475552515-1agdo4tviffo2sit07v941un8kmuf6p0...`
4. Click it to open the details

### Step 3: Add Authorized JavaScript Origins

In the **Authorized JavaScript origins** section, add these:

```
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000
```

**How to add:**
1. Click the **+ Add URI** button
2. Paste each origin one by one
3. Click Save

### Step 4: Add Authorized Redirect URIs (Optional - for callbacks)

If you're using OAuth with backend callback, add:

```
http://localhost:8000/api/auth/callback/google
```

---

## 📍 For Production Deployment

When deploying to production, add your production domain:

```
https://yourdomain.com
https://www.yourdomain.com
```

**Replace `yourdomain.com` with your actual domain.**

---

## 🧪 Testing After Configuration

1. **Wait 2-3 minutes** for Google to propagate the changes
2. Go to **http://localhost:5173** (or localhost:3000)
3. Look for the Google Login button
4. Click it and verify:
   - ✅ No "403 Forbidden" error
   - ✅ No "origin not allowed" message
   - ✅ Google login dialog appears

---

## 🛠️ Configuration Files Already Updated

The project now has all credentials set:

### Backend (Django)

**File:** `backend/portfolio/settings.py`
```python
GOOGLE_OAUTH2_CLIENT_ID = 'your-client-id.apps.googleusercontent.com'
GOOGLE_OAUTH2_CLIENT_SECRET = 'your-client-secret'
```

**Or via environment variables:**
```bash
GOOGLE_OAUTH2_CLIENT_ID=64475552515-1agdo4tviffo2sit07v941un8kmuf6p0.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=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
```

### Frontend (React)

**File:** `frontend/.env.local`
```bash
VITE_GOOGLE_OAUTH2_CLIENT_ID=64475552515-1agdo4tviffo2sit07v941un8kmuf6p0.apps.googleusercontent.com
```

### Email Configuration

**File:** `.env.example` or `.env`
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=waelbenabid1@gmail.com
EMAIL_HOST_PASSWORD=qcda ulgh gdhe gauo
DEFAULT_FROM_EMAIL=waelbenabid1@gmail.com
CONTACT_EMAIL=waelbenabid1@gmail.com
```

---

## 🔒 Security Checklist

- [ ] Client Secret: `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` is ONLY on backend
- [ ] Client Secret is NOT in frontend code
- [ ] `.env` files are in `.gitignore` (never commit credentials)
- [ ] Authorized origins are set in Google Console
- [ ] Email app password is only for development (use OAuth2 in production)

---

## 🚀 API Endpoints After Setup

Once configured, these endpoints will work:

```
POST /api/auth/login/          → Login with email/password
POST /api/auth/social/         → Google/OAuth social login
GET  /api/auth/profile/        → Get user profile (authenticated)
POST /api/auth/logout/         → Logout
POST /api/auth/refresh/        → Refresh access token
```

---

## 🧩 Architecture Flow

```
Frontend (localhost:5173)
    ↓
[Google OAuth Button]
    ↓
Google Login Dialog
    ↓
Get ID Token + User Info
    ↓
Backend API /api/auth/social/
    ↓
Verify Token + Create/Update User
    ↓
Return Access Token (in HttpOnly cookie)
    ↓
Store user in sessionStorage
    ↓
Redirect to Dashboard
```

---

## ⚠️ Troubleshooting

### Problem: Still getting 403 error after adding origins?

**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Clear browser cache and cookies for localhost
3. Wait 3-5 minutes for Google to fully propagate
4. Check in Google Console that origins were saved (reload the page)

### Problem: Google button doesn't appear?

**Check:**
1. Is `VITE_GOOGLE_OAUTH2_CLIENT_ID` set in `frontend/.env.local`?
2. Is the Client ID valid? (Should start with digits)
3. Is the frontend running on port 5173 or 3000?

### Problem: Login works but user not created?

**Check backend logs:**
```bash
docker logs portfolio_backend
# or
python manage.py runserver 0.0.0.0:8000
```

Look for token verification errors.

---

## 📚 Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In Setup](https://developers.google.com/identity/gsi/web)
- [Google Cloud Console](https://console.cloud.google.com)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## ✨ Summary

| Item | Status | Details |
|------|--------|---------|
| **Client ID** | ✅ Configured | In frontend `.env.local` and backend settings |
| **Client Secret** | ✅ Configured | In backend settings (never in frontend) |
| **Email** | ✅ Configured | waelbenabid1@gmail.com with app password |
| **JavaScript Origins** | ⏳ PENDING | Add in Google Cloud Console (THIS STEP) |
| **Redirect URIs** | ✅ Optional | Add if using OAuth callback endpoints |

**Next Action:** Configure **JavaScript Origins in Google Cloud Console** (see Step 3 above)

---

## 💡 Production Checklist

- [ ] Change DJANGO_DEBUG=false
- [ ] Update ALLOWED_HOSTS with production domain
- [ ] Update CORS_ALLOWED_ORIGINS with production domain
- [ ] Update CSRF_TRUSTED_ORIGINS with production domain
- [ ] Add production domain in Google Console
- [ ] Use HTTPS for all origins (not HTTP)
- [ ] Enable Django HTTPS security settings
- [ ] Use environment variables (not hardcoded values)
