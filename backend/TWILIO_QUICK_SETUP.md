# ⚡ Quick Twilio Setup - Your Credentials

## Your Twilio Credentials (from curl command):

- **Account SID**: `AC2266aad585e51235306c8fd20af0d67b` ✅
- **Messaging Service SID**: `MG7a1fba676fa79f9701850d49b0317e64` ✅
- **Auth Token**: Get from Twilio Console (click "View" to reveal)

---

## Step 1: Get Your Auth Token

1. Login to: **https://console.twilio.com/**
2. Your Account SID is already visible
3. Click **"View"** next to Auth Token to reveal it
4. Copy your Auth Token

---

## Step 2: Create .env File

Create `backend/.env` file with:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC2266aad585e51235306c8fd20af0d67b
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_MESSAGING_SERVICE_SID=MG7a1fba676fa79f9701850d49b0317e64

# Default country code (optional)
DEFAULT_COUNTRY_CODE=+1

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Replace `your_auth_token_here` with your actual Auth Token from Twilio Console!**

---

## Step 3: Install Twilio (if not already installed)

```bash
cd backend
npm install twilio
```

---

## Step 4: Restart Backend

1. Stop your backend (Ctrl+C)
2. Start again:
   ```bash
   cd backend
   npm start
   ```

---

## Step 5: Test It!

1. Open your app
2. Select contacts (any country!)
3. Start location sharing
4. Check backend console - you should see:
   ```
   ✅ SMS sent via Twilio to +919381503017 (SID: SM...)
   ```
5. Contacts will receive SMS! 🎉

---

## ✅ What's Configured

- ✅ Twilio is now **Option 1** (primary)
- ✅ Uses **Messaging Service SID** (better than phone number)
- ✅ Works with **all contacts globally**
- ✅ Your Account SID and Messaging Service SID are already set

---

## 📱 Phone Number Format

Twilio accepts any format:
- `+919381503017` ✅ (India)
- `9381503017` → automatically becomes `+919381503017` ✅
- `+1234567890` ✅ (US)
- Any country with country code ✅

---

## 🔍 Check Backend Console

When sending SMS, you'll see:
```
🔍 Environment Check:
   TWILIO_ACCOUNT_SID: ✅ Found
   TWILIO_AUTH_TOKEN: ✅ Found
   TWILIO_MESSAGING_SERVICE_SID: ✅ Found

📱 Attempting to send SMS to: +919381503017
🔑 Twilio credentials found
📡 Calling Twilio API
✅ SMS sent via Twilio to +919381503017 (SID: SM...)
```

---

## ❓ Troubleshooting

**"Auth Token not found"**
- Make sure you added `TWILIO_AUTH_TOKEN` to `.env`
- Restart backend after adding it

**"Unauthorized" error**
- Check Auth Token is correct
- Verify in Twilio Console

**SMS not received**
- Check Twilio Console → Monitor → Logs
- Verify phone number format
- In trial mode, recipient must be verified (add in Twilio Console)

---

**That's it!** Add your Auth Token to `.env` and restart backend. SMS will be sent to all selected contacts! 🚀

