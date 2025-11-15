# 📱 Twilio SMS Setup Guide

## Why Twilio?

- ✅ **Works globally** - Send SMS to any country
- ✅ **Very reliable** - Industry standard
- ✅ **Free trial** - $15.50 free credit to start
- ✅ **Easy integration** - Simple API
- ✅ **Works with all contacts** - No country restrictions

---

## Step 1: Sign Up for Twilio (Free Trial)

1. Go to: **https://www.twilio.com/try-twilio**
2. Click **"Start Free Trial"**
3. Fill in:
   - **Email address**
   - **Password**
   - **Full name**
   - **Phone number** (for verification)
4. Verify your email and phone number

**No credit card required for free trial!**

---

## Step 2: Get Your Twilio Credentials

After signing up and logging in:

1. **Go to Twilio Console**: https://console.twilio.com/
2. You'll see your **Account SID** and **Auth Token** on the dashboard

### Get Account SID:
- It's displayed on the dashboard
- Looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Starts with "AC"

### Get Auth Token:
- Click **"View"** next to Auth Token to reveal it
- Copy it (you won't see it again!)

### Get Phone Number:
1. Go to **"Phone Numbers"** → **"Manage"** → **"Buy a number"**
2. Select your country
3. Click **"Search"**
4. Choose a number (free trial numbers available)
5. Click **"Buy"** (it's free for trial)

---

## Step 3: Install Twilio Package

```bash
cd backend
npm install twilio
```

---

## Step 4: Create .env File

Create or update `backend/.env` file:

```env
# Twilio Configuration (Primary SMS Service)
TWILIO_ACCOUNT_SID=AC2266aad585e51235306c8fd20af0d67b
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_MESSAGING_SERVICE_SID=MG7a1fba676fa79f9701850d49b0317e64

# Alternative: Use phone number instead of Messaging Service
# TWILIO_PHONE_NUMBER=+1234567890

# Phone number settings (default country code)
# Use +91 for India, +1 for US/Canada, etc.
DEFAULT_COUNTRY_CODE=+91

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Replace:**
- `AC2266aad585e51235306c8fd20af0d67b` - Your Account SID (already filled)
- `your_auth_token_here` with your Auth Token (get from Twilio Console)
- `MG7a1fba676fa79f9701850d49b0317e64` - Your Messaging Service SID (already filled)

**Note:** Using `TWILIO_MESSAGING_SERVICE_SID` is recommended over `TWILIO_PHONE_NUMBER` as it's more flexible.

---

## Step 5: Restart Backend

1. Stop your backend server (Ctrl+C)
2. Start it again:
   ```bash
   cd backend
   npm start
   ```

---

## Step 6: Test It!

1. Open your app
2. Select contacts (any country!)
3. Start location sharing
4. Check backend console - you should see:
   ```
   ✅ SMS sent via Twilio to +1234567890 (SID: SM...)
   ```
5. Contacts will receive SMS! 🎉

---

## 📱 Phone Number Format

Twilio accepts phone numbers in international format:
- ✅ `+1234567890` (US)
- ✅ `+919392903079` (India)
- ✅ `+447123456789` (UK)
- ✅ Any country with country code

The app automatically formats numbers!

---

## 💰 Pricing

- **Free Trial**: $15.50 free credit
- **After Trial**: Pay per SMS (varies by country)
- **US/Canada**: ~$0.0075 per SMS
- **India**: ~$0.02 per SMS
- **Other countries**: Check Twilio pricing

---

## ✅ Advantages of Twilio

1. **Global Coverage**: Works with contacts in any country
2. **Reliable**: Industry-leading delivery rates
3. **No Restrictions**: No country-specific limitations
4. **Easy Setup**: Simple API integration
5. **Free Trial**: Test before paying

---

## 🔧 Troubleshooting

### "Invalid phone number"
- Make sure phone number includes country code: `+1234567890`
- Remove spaces, dashes, parentheses
- Format: `+[country code][number]`

### "Unauthorized" error
- Check Account SID is correct
- Verify Auth Token (click "View" to reveal)
- Make sure no extra spaces in `.env`

### "From number not verified"
- In trial mode, you can only send to verified numbers
- Add recipient numbers in Twilio Console → Phone Numbers → Verified Caller IDs
- Or upgrade account to send to any number

### SMS not received
- Check Twilio Console → Monitor → Logs for delivery status
- Verify recipient phone number is correct
- Some carriers may block SMS from unknown numbers

---

## 📊 Check SMS Status

1. Go to Twilio Console: https://console.twilio.com/
2. Click **"Monitor"** → **"Logs"** → **"Messaging"**
3. See all sent SMS and their status:
   - ✅ **Delivered** - SMS received
   - ⏳ **Queued** - Waiting to send
   - ❌ **Failed** - Check error message

---

## 🎯 Next Steps

1. Sign up for Twilio (free trial)
2. Get your credentials
3. Add to `.env` file
4. Install Twilio: `npm install twilio`
5. Restart backend
6. Start sending SMS to all your contacts! 🎉

---

## 💡 Pro Tips

1. **Verify numbers in trial**: Add recipient numbers in Twilio Console for testing
2. **Monitor usage**: Check Twilio Console for SMS logs and balance
3. **Set up alerts**: Configure alerts for low balance
4. **Use webhooks**: Set up delivery status callbacks (advanced)

---

**Ready to use Twilio?** Follow the steps above and you'll be sending SMS in minutes! 🚀

