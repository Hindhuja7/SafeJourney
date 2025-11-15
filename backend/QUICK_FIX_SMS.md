# ⚡ Quick Fix for SMS Not Working

## 🚨 Current Error: 20404 - Resource Not Found

This means your **Account SID** or **Auth Token** is incorrect.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Get Fresh Credentials from Twilio

1. Go to: **https://console.twilio.com/**
2. Login
3. On Dashboard, copy:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click "View" to reveal)

### Step 2: Update backend/.env

Open `backend/.env` and replace with your actual values:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_MESSAGING_SERVICE_SID=MG7a1fba676fa79f9701850d49b0317e64
DEFAULT_COUNTRY_CODE=+91
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Important:**
- Copy Account SID exactly (starts with `AC`)
- Copy Auth Token exactly (it's long, copy all of it)
- No spaces around `=`
- No quotes

### Step 3: Restart Backend

```bash
# Stop backend (Ctrl+C)
cd backend
npm start
```

---

## 🧪 Test It

```bash
cd backend
node test-sms-send.js +919381503017
```

Replace `+919381503017` with your phone number.

**If successful, you'll see:**
```
✅ SMS sent successfully!
```

---

## ❌ Still Not Working?

**Check these:**

1. ✅ Account SID and Auth Token are from the **same Twilio account**
2. ✅ `.env` file is in `backend/` folder (not root)
3. ✅ File name is exactly `.env` (with dot)
4. ✅ Backend server was restarted
5. ✅ No extra spaces in `.env` file

---

**Most likely issue:** Account SID and Auth Token don't match. Get fresh ones from Twilio Console! 🔄

