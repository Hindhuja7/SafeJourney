# 📋 Copy This to Your .env File

## Your Twilio Credentials:

From your curl command:
- **Account SID**: `AC2266aad585e51235306c8fd20af0d67b`
- **Messaging Service SID**: `MG7a1fba676fa79f9701850d49b0317e64`
- **Auth Token**: Get from Twilio Console (click "View" to reveal)

---

## Step 1: Get Your Auth Token

1. Go to: **https://console.twilio.com/**
2. Login with your account
3. Find **"Auth Token"** on the dashboard
4. Click **"View"** to reveal it
5. Copy your Auth Token

---

## Step 2: Create .env File

Create a file named `.env` in the `backend` folder and copy this:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC2266aad585e51235306c8fd20af0d67b
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_MESSAGING_SERVICE_SID=MG7a1fba676fa79f9701850d49b0317e64

# Default country code for India
DEFAULT_COUNTRY_CODE=+91

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Replace `your_auth_token_here` with your actual Auth Token from Twilio Console!**

---

## Step 3: Verify File Location

- ✅ File must be in: `backend/.env`
- ✅ File name is exactly: `.env` (with the dot at the start)
- ✅ Not in root folder, not in frontend folder

---

## Step 4: Restart Backend

**IMPORTANT:** After creating `.env`:

1. Stop backend (Ctrl+C)
2. Start again:
   ```bash
   cd backend
   npm start
   ```

---

## Step 5: Test

1. Open your app
2. Enter phone number: `9381503017` or `+919381503017`
3. Start location sharing
4. Check console - should see: `✅ SMS sent via Twilio to +919381503017`

---

## ✅ What's Configured

- ✅ Account SID: `AC2266aad585e51235306c8fd20af0d67b`
- ✅ Messaging Service SID: `MG7a1fba676fa79f9701850d49b0317e64`
- ✅ Default Country: `+91` (India)
- ⚠️ Auth Token: You need to add this from Twilio Console

---

**After adding your Auth Token and restarting, SMS will be sent to all selected contacts!** 🚀

