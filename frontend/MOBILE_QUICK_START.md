# 📱 Mobile Quick Start Guide

## 🚀 Fastest Way to Deploy to Mobile

### Prerequisites Check

```bash
# Check Node.js
node --version  # Should be 16+

# Check if Capacitor installed
cd frontend
npm list @capacitor/core
```

---

## ⚡ Quick Setup (5 Minutes)

### 1. Configure Backend URL

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**For production:** Replace with your deployed backend URL

---

### 2. Build Web App

```bash
cd frontend
npm run build
```

---

### 3. Add Mobile Platform

**Android:**
```bash
npm run mobile:add:android
```

**iOS (Mac only):**
```bash
npm run mobile:add:ios
```

---

### 4. Sync to Mobile

```bash
npm run mobile:sync
```

---

### 5. Open and Run

**Android:**
```bash
npm run mobile:android
# Then click Run in Android Studio
```

**iOS:**
```bash
npm run mobile:ios
# Then click Run in Xcode
```

---

## 🔄 After Making Changes

```bash
npm run build
npm run mobile:sync
# Then run from Android Studio / Xcode
```

---

## 📱 Test on Real Device

### Android:
1. Enable USB Debugging on phone
2. Connect via USB
3. Select device in Android Studio
4. Click Run

### iOS:
1. Connect iPhone via USB
2. Select device in Xcode
3. Sign in with Apple ID
4. Click Run

---

## ⚠️ Common Issues

**"API not working"**
- Check `.env.local` has correct backend URL
- For local testing, use PC IP: `http://192.168.1.100:5000`

**"Location not working"**
- Grant location permission on device
- Check permissions in AndroidManifest.xml / Info.plist

**"Build fails"**
- Run: `npm install` in frontend folder
- Clean: `cd android && ./gradlew clean` (Android)

---

**Full guide:** See `MOBILE_DEPLOYMENT_COMPLETE.md` in project root

