# 🚨 SMS Not Working - Troubleshooting Guide

## ❌ Error: 20404 - Resource Not Found

This error means Twilio can't find your account. This usually happens when:

1. **Account SID is incorrect**
2. **Auth Token doesn't match the Account SID**
3. **Account SID and Auth Token are from different accounts**

---

## ✅ Step-by-Step Fix

### Step 1: Verify Your Twilio Credentials

1. Go to: **https://console.twilio.com/**
2. Login to your Twilio account
3. Check the **Dashboard** - you'll see:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click "View" to reveal)

### Step 2: Check Your .env File

Open `backend/.env` and verify:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- ✅ Account SID must start with `AC`
- ✅ Auth Token must match the Account SID
- ✅ No extra spaces around `=`
- ✅ No quotes around values

### Step 3: Common Issues

#### Issue 1: Wrong Account SID
**Symptom:** Error 20404
**Fix:** Copy Account SID directly from Twilio Console

#### Issue 2: Wrong Auth Token
**Symptom:** Error 20404 or 20003
**Fix:** 
- Get fresh Auth Token from Twilio Console
- Click "View" next to Auth Token
- Copy the entire token (it's long!)

#### Issue 3: Account SID and Auth Token Mismatch
**Symptom:** Error 20404
**Fix:** Make sure both are from the same Twilio account

#### Issue 4: Messaging Service SID Wrong
**Symptom:** Error 20404 or 21211
**Fix:**
- Go to Twilio Console → Messaging → Services
- Copy the correct Messaging Service SID (starts with `MG`)

---

## 🧪 Test Your Configuration

Run this test script:

```bash
cd backend
node test-twilio.js
```

**Expected output:**
```
✅ All Twilio credentials are configured!
✅ Ready to send SMS to selected contacts
```

If you see errors, check your `.env` file.

---

## 🧪 Test SMS Sending

Test sending a real SMS:

```bash
cd backend
node test-sms-send.js +919381503017
```

**Replace `+919381503017` with your phone number**

**Expected output:**
```
✅ SMS sent successfully!
   Method: Twilio
   Phone: +919381503017
   SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔍 Check Backend Logs

When you try to send SMS, check the backend console. You should see:

```
🔍 Environment Check:
   TWILIO_ACCOUNT_SID: ✅ Found
   TWILIO_AUTH_TOKEN: ✅ Found
   TWILIO_MESSAGING_SERVICE_SID: ✅ Found
```

If you see `❌ Not found`, your `.env` file is not being loaded.

---

## ⚠️ Common Mistakes

### Mistake 1: Wrong File Location
- ❌ `.env` in root folder
- ❌ `.env` in frontend folder
- ✅ `.env` in `backend/` folder

### Mistake 2: Wrong File Name
- ❌ `env` (no dot)
- ❌ `.env.txt`
- ✅ `.env` (exactly this name)

### Mistake 3: Not Restarting Server
- ❌ Changed `.env` but didn't restart
- ✅ **Always restart backend after changing `.env`**

### Mistake 4: Extra Spaces
- ❌ `TWILIO_ACCOUNT_SID = AC123` (spaces around =)
- ✅ `TWILIO_ACCOUNT_SID=AC123` (no spaces)

### Mistake 5: Quotes Around Values
- ❌ `TWILIO_ACCOUNT_SID="AC123"`
- ✅ `TWILIO_ACCOUNT_SID=AC123` (no quotes needed)

---

## 🔄 After Fixing .env

1. **Stop backend** (Ctrl+C)
2. **Restart backend:**
   ```bash
   cd backend
   npm start
   ```
3. **Test again:**
   ```bash
   node test-sms-send.js +919381503017
   ```

---

## 📋 Quick Checklist

- [ ] `.env` file is in `backend/` folder
- [ ] File name is exactly `.env` (with dot)
- [ ] `TWILIO_ACCOUNT_SID` starts with `AC`
- [ ] `TWILIO_AUTH_TOKEN` matches the Account SID
- [ ] `TWILIO_MESSAGING_SERVICE_SID` starts with `MG`
- [ ] No extra spaces around `=`
- [ ] No quotes around values
- [ ] Backend server restarted after changes
- [ ] Test script shows all credentials found

---

## 🆘 Still Not Working?

### Check Twilio Console

1. Go to **Twilio Console → Logs → Messaging**
2. Check for error messages
3. Verify your account is active

### Verify Phone Number Format

- ✅ `+919381503017` (with country code)
- ✅ `9381503017` (will be formatted to +91)
- ❌ `0919381503017` (extra 0)

### Check Twilio Account Status

- Make sure your Twilio account is not suspended
- Check if you have credits/balance
- Verify phone number is verified (for trial accounts)

---

## 💡 Need More Help?

1. **Check backend console** for detailed error messages
2. **Run test scripts** to verify configuration
3. **Check Twilio Console** for account status
4. **Verify .env file** format and location

---

**Most common fix:** Make sure Account SID and Auth Token are from the same Twilio account and restart the backend server! 🔄

