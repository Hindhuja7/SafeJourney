# Mobile Deployment Guide for SafeJourney

> **⚠️ This is the old guide. For complete mobile deployment instructions, see [MOBILE_DEPLOYMENT_COMPLETE.md](./MOBILE_DEPLOYMENT_COMPLETE.md)**

This guide explains how to deploy SafeJourney as a mobile application using two methods:

## Method 1: Progressive Web App (PWA) - Easiest ✅

### What is PWA?
A Progressive Web App works like a native app but runs in a browser. Users can install it on their home screen.

### Setup Steps:

1. **Create App Icons** (Required):
   - Create `icon-192.png` (192x192 pixels)
   - Create `icon-512.png` (512x512 pixels)
   - Place them in `frontend/public/` folder
   - You can use online tools like: https://www.favicon-generator.org/

2. **Build and Deploy**:
   ```bash
   cd frontend
   npm run build
   npm start
   ```

3. **Deploy to Hosting**:
   - Deploy to Vercel (recommended for Next.js):
     ```bash
     npm install -g vercel
     vercel
     ```
   - Or deploy to Netlify, Firebase Hosting, etc.

4. **Install on Mobile**:
   - **Android**: Open the website in Chrome → Menu → "Add to Home screen"
   - **iOS**: Open in Safari → Share → "Add to Home Screen"

### PWA Features Already Configured:
- ✅ Manifest.json (app metadata)
- ✅ Service Worker (offline support)
- ✅ Mobile-optimized meta tags
- ✅ Install prompts

---

## Method 2: Native App with Capacitor (More Native Experience) 🚀

### What is Capacitor?
Capacitor wraps your web app in a native container, allowing you to publish to App Store and Google Play.

### Setup Steps:

1. **Install Capacitor**:
   ```bash
   cd frontend
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/ios @capacitor/android
   ```

2. **Initialize Capacitor**:
   ```bash
   npx cap init
   # App name: SafeJourney
   # App ID: com.safejourney.app
   # Web dir: .next
   ```

3. **Build Your App**:
   ```bash
   npm run build
   ```

4. **Add Platforms**:
   ```bash
   npx cap add ios
   npx cap add android
   ```

5. **Sync and Open**:
   ```bash
   npx cap sync
   
   # For iOS (Mac only):
   npx cap open ios
   
   # For Android:
   npx cap open android
   ```

6. **Configure Native Features**:
   - **Location Permissions**: Already handled in your code
   - **Battery API**: May need native plugins for better support
   - **Notifications**: Add `@capacitor/push-notifications` if needed

7. **Build Native Apps**:
   - **iOS**: Use Xcode to build and submit to App Store
   - **Android**: Use Android Studio to build and submit to Google Play

### Required Native Permissions:

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

Add to `ios/App/App/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>SafeJourney needs your location to share live location with trusted contacts</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>SafeJourney needs your location to share live location with trusted contacts</string>
```

---

## Method 3: React Native (Complete Rewrite) ⚠️

This would require rewriting your components in React Native. Not recommended unless you need native-only features.

---

## Recommended Approach:

1. **Start with PWA** (Method 1) - Quickest way to get on mobile
2. **Upgrade to Capacitor** (Method 2) - If you need App Store/Play Store distribution

---

## Testing Mobile Features:

### Test on Real Device:
1. Deploy to a public URL (Vercel/Netlify)
2. Open on mobile device
3. Test:
   - Location sharing
   - Battery detection
   - Map rendering
   - Contact selection

### Test Locally:
```bash
# Get your local IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Access from mobile: http://YOUR_IP:3000
# Make sure mobile and computer are on same WiFi
```

---

## Mobile-Specific Optimizations Already Done:

✅ Responsive design with Tailwind CSS
✅ Touch-friendly buttons and inputs
✅ Geolocation API integration
✅ Battery API detection
✅ Mobile viewport meta tags
✅ PWA manifest configuration

---

## Next Steps:

1. Create app icons (192x192 and 512x512 PNG files)
2. Choose deployment method (PWA recommended first)
3. Test on real mobile devices
4. Deploy to hosting service
5. (Optional) Set up Capacitor for native app stores

---

## Troubleshooting:

### PWA not installing?
- Ensure HTTPS (required for PWA)
- Check manifest.json is accessible
- Verify service worker is registered

### Location not working?
- Check browser permissions
- Ensure HTTPS (required for geolocation)
- Test on real device (not emulator)

### Battery API not working?
- Only works in Chrome/Edge on Android
- Use manual interval selection as fallback

---

## Deployment Checklist:

- [ ] Create app icons (192x192, 512x512)
- [ ] Test PWA installation
- [ ] Test location sharing
- [ ] Test on iOS and Android
- [ ] Deploy to hosting
- [ ] (Optional) Set up Capacitor
- [ ] (Optional) Submit to app stores

