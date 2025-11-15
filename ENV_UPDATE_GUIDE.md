# 🔧 Environment Variables Update Guide

## ✅ Good News: No Code Changes Needed!

The code is already set up to use environment variables dynamically. **You don't need to update any code** - just make sure your `.env` files are in the right place and restart your servers.

---

## 📋 Environment Variables Used

### Backend (`.env` in `backend/` folder)

**Required for SMS:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
```

**Optional:**
```env
TWILIO_PHONE_NUMBER=your_twilio_phone_number  # Alternative to Messaging Service SID
DEFAULT_COUNTRY_CODE=+91  # Default: +91 (India)
PORT=5000  # Default: 5000
FRONTEND_URL=http://localhost:3000  # Default: http://localhost:3000
```

### Frontend (`.env.local` in `frontend/` folder)

**For API URL:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**For production/mobile:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## 🔄 After Changing .env Files

### Step 1: Check File Locations

**Backend `.env`:**
- Location: `backend/.env`
- Must be in the `backend` folder (same level as `index.js`)

**Frontend `.env.local`:**
- Location: `frontend/.env.local`
- Must be in the `frontend` folder (same level as `package.json`)

### Step 2: Restart Servers

**⚠️ IMPORTANT:** Environment variables are loaded when the server starts. You **MUST restart** after changing `.env` files!

**Backend:**
```bash
# Stop the backend (Ctrl+C)
# Then restart:
cd backend
npm start
```

**Frontend:**
```bash
# Stop the frontend (Ctrl+C)
# Then restart:
cd frontend
npm run dev
```

---

## ✅ Verification

### Check Backend Environment Variables

The backend will log environment variables when sending SMS. Look for:
```
🔍 Environment Check:
   TWILIO_ACCOUNT_SID: ✅ Found
   TWILIO_AUTH_TOKEN: ✅ Found
   TWILIO_MESSAGING_SERVICE_SID: ✅ Found
```

### Check Frontend API URL

Open browser console and check:
- Network requests should go to your `NEXT_PUBLIC_API_URL`
- If you see `http://localhost:5000` but changed it, restart frontend

---

## 🐛 Common Issues

### "Environment variable not found"

**Backend:**
1. Check `.env` is in `backend/` folder (not root)
2. Check file name is exactly `.env` (with dot, no extension)
3. Restart backend server
4. Check `dotenv.config()` is called in `backend/index.js` (it is ✅)

**Frontend:**
1. Check `.env.local` is in `frontend/` folder
2. Check variable name starts with `NEXT_PUBLIC_` (required for Next.js)
3. Restart frontend server
4. Rebuild if needed: `npm run build`

### "API calls going to wrong URL"

1. Check `frontend/.env.local` has correct `NEXT_PUBLIC_API_URL`
2. Restart frontend server
3. Clear browser cache
4. Check `frontend/config/api.js` is using the environment variable (it is ✅)

### "SMS not working after changing Twilio credentials"

1. Check `backend/.env` has all 3 Twilio variables
2. Check no extra spaces in `.env` file
3. Restart backend server
4. Check backend console for environment check logs

---

## 📝 Quick Checklist

After changing `.env` files:

- [ ] `.env` file in correct location (`backend/.env`)
- [ ] `.env.local` file in correct location (`frontend/.env.local`)
- [ ] No typos in variable names
- [ ] No extra spaces around `=` sign
- [ ] Backend server restarted
- [ ] Frontend server restarted
- [ ] Check console logs for environment variables

---

## 🔍 What Variables Are Used Where

### Backend (`backend/.env`)

| Variable | Used In | Required? |
|----------|---------|-----------|
| `TWILIO_ACCOUNT_SID` | `smsService.js` | ✅ Yes (for SMS) |
| `TWILIO_AUTH_TOKEN` | `smsService.js` | ✅ Yes (for SMS) |
| `TWILIO_MESSAGING_SERVICE_SID` | `smsService.js` | ✅ Yes (or `TWILIO_PHONE_NUMBER`) |
| `TWILIO_PHONE_NUMBER` | `smsService.js` | Optional (alternative) |
| `DEFAULT_COUNTRY_CODE` | `smsService.js` | Optional (default: +91) |
| `PORT` | `index.js` | Optional (default: 5000) |
| `FRONTEND_URL` | `index.js` | Optional (default: localhost:3000) |

### Frontend (`frontend/.env.local`)

| Variable | Used In | Required? |
|----------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | `config/api.js` | Optional (default: localhost:5000) |

---

## 💡 Pro Tips

1. **Never commit `.env` files** - They're in `.gitignore` ✅
2. **Use `.env.local` for frontend** - Next.js loads this automatically
3. **Restart after changes** - Environment variables load on startup
4. **Check console logs** - Backend logs show which variables are found
5. **Test with a simple change** - Change `PORT` to verify it works

---

## ✅ Summary

**No code changes needed!** The code already uses environment variables with fallbacks. Just:

1. ✅ Update your `.env` files
2. ✅ Restart your servers
3. ✅ Check console logs to verify

That's it! 🎉

