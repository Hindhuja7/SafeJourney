# 🚨 Emergency Alert Troubleshooting Guide

## Common Errors and Fixes

### Error 1: "No active live location session found"

**Cause:** Location sharing is not active when trying to trigger emergency alert.

**Fix:**
1. Make sure location sharing is started first
2. Wait for at least one location update
3. Then trigger emergency alert

---

### Error 2: "SOS alert system not active"

**Cause:** SOS alert system hasn't been started.

**Fix:**
1. Start location sharing
2. Click "Start SOS Alert System"
3. Then trigger emergency alert

---

### Error 3: "Missing location or contacts"

**Cause:** No location data or no contacts selected.

**Fix:**
1. Make sure location sharing is active and has location data
2. Make sure at least 1 contact is selected
3. Wait for location to update before triggering emergency

---

### Error 4: SMS Not Sending

**Cause:** Twilio credentials incorrect or SMS service not configured.

**Fix:**
1. Check `backend/.env` has correct Twilio credentials
2. Run test: `node test-twilio.js`
3. Run SMS test: `node test-sms-send.js +919381503017`
4. Restart backend after fixing `.env`

---

### Error 5: "Error finding police stations"

**Cause:** OpenStreetMap API error or network issue.

**Fix:**
- This is not critical - emergency alert will still be sent
- Police station info will be missing from SMS
- Location and emergency numbers will still be included

---

### Error 6: "Geocoding error"

**Cause:** Reverse geocoding API error.

**Fix:**
- This is not critical - emergency alert will still be sent
- Address will be missing, but coordinates will be included
- Google Maps link will still work

---

## 🔍 Check Backend Console

When emergency alert is triggered, check backend console for:

**Success:**
```
🚨 SENDING EMERGENCY SOS ALERT to 1 contact(s)
✅ SMS sent via Twilio to +919381503017
🚨 Emergency alert sent: [{ success: true, ... }]
```

**Error:**
```
❌ Error sending emergency alert: [error details]
❌ Cannot send emergency alert: Missing location or contacts
```

---

## ✅ Verification Steps

### Step 1: Check Location Sharing is Active

1. Start location sharing
2. Wait for location to update
3. Check status shows active location

### Step 2: Check SOS Alert is Active

1. Start SOS Alert System
2. Check countdown timer is running
3. Verify SOS status is active

### Step 3: Check Contacts

1. Verify at least 1 contact is selected
2. Check contact has valid phone number
3. Verify contact format: `+919381503017` or `9381503017`

### Step 4: Test Emergency Alert

1. Click "I'm NOT Safe" button
2. Check backend console for logs
3. Verify SMS was sent (check phone)

---

## 🧪 Test Emergency Alert Manually

You can test the emergency alert endpoint directly:

```bash
# Make sure location sharing is active first
curl -X POST http://localhost:5000/api/live-location/sos/emergency \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

**Expected response:**
```json
{
  "message": "EMERGENCY ALERT TRIGGERED - No response detected",
  "emergencyTriggered": true
}
```

---

## 📋 Checklist

Before triggering emergency alert:

- [ ] Location sharing is active
- [ ] At least one location update has been received
- [ ] SOS Alert System is started
- [ ] At least 1 contact is selected
- [ ] Contact has valid phone number
- [ ] Twilio credentials are configured correctly
- [ ] Backend server is running
- [ ] Check backend console for error messages

---

## 🐛 Debug Mode

Check backend console logs for detailed error information:

1. **Location check:**
   ```
   ❌ Cannot send emergency alert: Missing location or contacts
      - No current location available
   ```

2. **Contacts check:**
   ```
   ❌ Cannot send emergency alert: Missing location or contacts
      - No contacts available
   ```

3. **SMS sending:**
   ```
   ❌ Twilio error: [error details]
   ```

---

## 💡 Common Issues

### Issue: Emergency alert triggered but no SMS received

**Check:**
1. Backend console - did SMS send successfully?
2. Twilio credentials - are they correct?
3. Phone number format - is it correct?
4. Twilio account - is it active and has credits?

### Issue: "SOS alert system not active" error

**Fix:**
1. Make sure you clicked "Start SOS Alert System" button
2. Check SOS status shows as active
3. Restart location sharing if needed

### Issue: Emergency alert fails silently

**Check:**
1. Backend console for error messages
2. Check if location is available
3. Check if contacts are available
4. Check Twilio configuration

---

## 🆘 Still Not Working?

1. **Check backend console** - Look for error messages
2. **Test SMS directly** - Run `node test-sms-send.js +919381503017`
3. **Check Twilio Console** - Verify account status and logs
4. **Verify location sharing** - Make sure it's active and has location data
5. **Check contacts** - Make sure at least 1 contact is selected

---

**Most common fix:** Make sure location sharing is active and has location data before triggering emergency alert! 📍

