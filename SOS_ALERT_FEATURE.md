# 🚨 SOS Alert Feature - Complete Guide

## Overview

The SOS Alert feature provides automatic safety check-ins during live location sharing. If you don't respond or indicate you're not safe, an emergency alert is automatically sent to your contacts with your location and nearby police stations.

---

## ✨ Features

1. **Periodic Safety Check-Ins**
   - Choose check-in intervals: 5, 10, or 20 minutes
   - Countdown timer shows time until next check-in
   - Visual and clear prompts

2. **Safe/Not Safe Buttons**
   - **Green "I'm Safe" button** - Confirms you're okay
   - **Red "I'm NOT Safe" button** - Triggers immediate emergency alert

3. **Automatic Emergency Trigger**
   - If you don't respond within 30 seconds, emergency alert is sent automatically
   - If you click "I'm NOT Safe", emergency alert is sent immediately

4. **Emergency Alert Includes:**
   - Your current location (address and coordinates)
   - Google Maps link to your location
   - Nearest police stations (up to 2) with addresses and distances
   - Google Maps links to police stations
   - Emergency contact numbers (Police: 100, Women Helpline: 1091, etc.)

---

## 🎯 How It Works

### Step 1: Start Location Sharing
1. Select at least 3 contacts
2. Choose location update interval
3. Click "Start Sharing"

### Step 2: Enable SOS Alert
1. After location sharing starts, you'll see the SOS Alert section
2. Choose check-in interval (5, 10, or 20 minutes)
3. Click "🛡️ Start SOS Alert System"

### Step 3: Countdown Timer
- A countdown timer shows time until next check-in
- Example: "Next safety check-in in: 8:45"

### Step 4: Safety Check-In Prompt
- When timer reaches zero, a prompt appears:
  - "Are you safe? Please confirm your safety status."
  - Two buttons: "✅ I'm Safe" (green) and "🚨 I'm NOT Safe" (red)

### Step 5: Response Options

**Option A: Click "I'm Safe" (Green)**
- Check-in recorded
- Timer resets for next interval
- No emergency alert sent

**Option B: Click "I'm NOT Safe" (Red)**
- **EMERGENCY ALERT TRIGGERED IMMEDIATELY**
- SMS sent to all selected contacts with:
  - Your location
  - Nearby police stations
  - Emergency numbers
- SOS system stops (no more check-ins)

**Option C: No Response (30 seconds)**
- After 30 seconds of no response, emergency alert is automatically sent
- Same information as Option B

---

## 📱 User Interface

### SOS Alert Setup
```
🛡️ SOS Safety Alert System

Enable periodic safety check-ins. If you don't respond or indicate 
you're not safe, an emergency alert will be sent to your contacts 
with your location and nearby police stations.

Check-In Interval
[5 min] [10 min] [20 min] ← Select one

[🛡️ Start SOS Alert System]
```

### Active SOS Alert
```
🛡️ SOS Alert Active

Next safety check-in in:
8:45

You will be prompted to confirm your safety at the next check-in time.
```

### Check-In Prompt
```
⏰ Safety Check-In Required

Are you safe? Please confirm your safety status.

[✅ I'm Safe]  [🚨 I'm NOT Safe]

If you don't respond, an emergency alert will be sent automatically.
```

### Emergency Triggered
```
🚨 EMERGENCY ALERT SENT

Your emergency contacts have been notified with your location 
and nearby police stations.

Help is on the way. Stay safe!
```

---

## 🔧 Technical Details

### Backend Endpoints

1. **POST `/api/live-location/sos/start`**
   - Starts SOS alert system
   - Body: `{ userId, checkInIntervalMinutes: 5|10|20 }`

2. **POST `/api/live-location/sos/checkin`**
   - User checks in (safe or not safe)
   - Body: `{ userId, isSafe: true|false }`
   - If `isSafe: false`, triggers emergency alert

3. **POST `/api/live-location/sos/emergency`**
   - Manually trigger emergency (no response timeout)
   - Body: `{ userId }`

4. **GET `/api/live-location/sos/status/:userId`**
   - Get current SOS status
   - Returns: `{ isActive, checkInIntervalMinutes, nextCheckIn, lastCheckIn, emergencyTriggered }`

### Frontend Component

- **File**: `frontend/components/SOSAlert.js`
- **Props**: `userId`, `isLocationSharing`
- **Features**:
  - Countdown timer
  - Check-in prompt
  - Safe/Not Safe buttons
  - Auto-emergency trigger (30 seconds)

### Services

1. **Police Station Service** (`backend/services/policeStationService.js`)
   - Finds nearby police stations using OpenStreetMap
   - Returns up to 3 nearest stations with addresses and distances

2. **Emergency Alert SMS** (`backend/services/smsService.js`)
   - `sendEmergencyAlert()` function
   - Sends detailed emergency message with location and police stations

---

## 📋 Emergency Alert SMS Format

```
🚨 EMERGENCY SOS ALERT 🚨

[User Name] is NOT SAFE and needs immediate help!

📍 Current Location:
[Address or coordinates]
🗺️ View on map: [Google Maps link]

⏰ Time: [Timestamp]

🚔 Nearest Police Stations:
1. [Station Name] ([distance] km away)
   📍 [Address]
   🗺️ [Google Maps link]

2. [Station Name] ([distance] km away)
   📍 [Address]
   🗺️ [Google Maps link]

📞 Emergency Numbers:
Police: 100
Women Helpline: 1091
Child Helpline: 1098

⚠️ Please take immediate action!
```

---

## 🎮 Usage Flow

```
1. User starts location sharing
   ↓
2. User enables SOS Alert (selects 5/10/20 min interval)
   ↓
3. Countdown timer starts
   ↓
4. Timer reaches zero → Check-in prompt appears
   ↓
5. User has 3 options:
   ├─ Click "I'm Safe" → Timer resets, continue
   ├─ Click "I'm NOT Safe" → Emergency alert sent immediately
   └─ No response (30 sec) → Emergency alert sent automatically
```

---

## ⚙️ Configuration

### Check-In Intervals
- **5 minutes**: More frequent check-ins (recommended for high-risk situations)
- **10 minutes**: Balanced (default)
- **20 minutes**: Less frequent (for longer journeys)

### Auto-Emergency Timeout
- **30 seconds**: Grace period after check-in prompt
- If no response, emergency alert is automatically sent

---

## 🔒 Safety Features

1. **Automatic Detection**: No response = emergency
2. **Manual Trigger**: "I'm NOT Safe" button = immediate emergency
3. **Location Tracking**: Always uses latest location
4. **Police Station Info**: Automatically finds nearest stations
5. **Multiple Contacts**: Alerts all selected contacts simultaneously

---

## 📝 Notes

- SOS Alert only works when location sharing is active
- Emergency alerts include Google Maps links for easy navigation
- Police station search uses OpenStreetMap (free, no API key needed)
- SMS alerts use your configured Twilio service
- All check-ins are logged in the session history

---

## 🐛 Troubleshooting

### "SOS Alert System not active"
- Make sure location sharing is started first
- Check that you've clicked "Start SOS Alert System"

### "Emergency alert not sent"
- Check Twilio configuration in backend `.env`
- Verify contacts have valid phone numbers
- Check backend console for error messages

### "Police stations not found"
- OpenStreetMap may not have data for your area
- Emergency alert will still be sent with location
- Contacts can use Google Maps link to find help

---

## ✅ Checklist

- [x] Backend SOS endpoints created
- [x] Police station service implemented
- [x] Emergency SMS alert function created
- [x] Frontend SOS component with countdown timer
- [x] Safe/Not Safe buttons implemented
- [x] Auto-emergency trigger (30 seconds)
- [x] Integration with LiveLocationShare component
- [x] API endpoints added to config

---

**The SOS Alert feature is now fully functional!** 🎉

Stay safe! 🛡️

