# 📱 Complete Mobile Deployment Guide for SafeJourney

This guide will help you deploy SafeJourney as a native mobile app for both Android and iOS.

---

## 🎯 Overview

SafeJourney is now configured to work as:
1. **Web App** (Next.js) - Works in browsers
2. **Progressive Web App (PWA)** - Installable on mobile home screens
3. **Native Mobile App** (Capacitor) - Full native app for Android & iOS

---

## ✅ What's Already Configured

- ✅ Capacitor installed and configured
- ✅ Native plugins (Geolocation, App, StatusBar)
- ✅ API configuration for mobile
- ✅ Environment variable support
- ✅ Mobile build scripts

---

## 📋 Prerequisites

### For Android Development:
- [ ] **Android Studio** installed
- [ ] **Java JDK 11+** installed
- [ ] **Android SDK** configured
- [ ] **Environment variables** set:
  - `ANDROID_HOME` or `ANDROID_SDK_ROOT`
  - `JAVA_HOME`

### For iOS Development (Mac only):
- [ ] **Xcode** installed (from App Store)
- [ ] **Xcode Command Line Tools**: `xcode-select --install`
- [ ] **CocoaPods**: `sudo gem install cocoapods`

### For Both:
- [ ] **Node.js** 16+ installed
- [ ] **Backend deployed** (or running locally)

---

## 🚀 Step-by-Step Mobile Deployment

### Step 1: Configure Backend URL

**For Production:**
1. Deploy your backend to a hosting service:
   - **Railway**: https://railway.app (Recommended)
   - **Render**: https://render.com
   - **Heroku**: https://heroku.com
   - **AWS/Google Cloud**: Any cloud provider

2. Get your backend URL (e.g., `https://safejourney-backend.railway.app`)

3. Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

**For Local Testing:**
1. Find your PC's IP address:
   ```powershell
   # Windows
   ipconfig | findstr IPv4
   
   # Mac/Linux
   ifconfig | grep inet
   ```

2. Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://YOUR_PC_IP:5000
   ```
   Example: `http://192.168.1.100:5000`

---

### Step 2: Build the Web App

```bash
cd frontend
npm run build
```

This creates the optimized production build in `.next` folder.

---

### Step 3: Add Mobile Platforms

**Add Android:**
```bash
cd frontend
npm run mobile:add:android
```

**Add iOS (Mac only):**
```bash
cd frontend
npm run mobile:add:ios
```

---

### Step 4: Sync Capacitor

After building, sync the web assets to mobile:

```bash
cd frontend
npm run mobile:sync
```

This copies your built app to the native projects.

---

### Step 5: Configure Native Permissions

#### Android Permissions

Edit `frontend/android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
  <!-- Add these permissions -->
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  <uses-permission android:name="android.permission.READ_CONTACTS" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  
  <application>
    <!-- Your app config -->
  </application>
</manifest>
```

#### iOS Permissions

Edit `frontend/ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>SafeJourney needs your location to share it with your emergency contacts.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>SafeJourney needs your location to continuously share it with your emergency contacts.</string>

<key>NSContactsUsageDescription</key>
<string>SafeJourney needs access to your contacts to select emergency contacts.</string>

<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

---

### Step 6: Build and Run

#### Android

**Option A: Using Android Studio (Recommended)**
```bash
cd frontend
npm run mobile:android
```
This opens Android Studio. Then:
1. Wait for Gradle sync
2. Click "Run" (green play button)
3. Select device/emulator

**Option B: Command Line**
```bash
cd frontend/android
./gradlew assembleDebug
./gradlew installDebug
```

**Generate APK:**
```bash
cd frontend/android
./gradlew assembleRelease
# APK will be in: app/build/outputs/apk/release/
```

#### iOS (Mac only)

```bash
cd frontend
npm run mobile:ios
```
This opens Xcode. Then:
1. Select your device/simulator
2. Click "Run" (play button)
3. Wait for build and install

**Generate IPA (for App Store):**
1. In Xcode: Product → Archive
2. Distribute App → App Store Connect
3. Follow the prompts

---

## 🔧 Configuration Files

### Capacitor Config (`frontend/capacitor.config.json`)

Already configured with:
- App ID: `com.safejourney.app`
- App Name: `SafeJourney`
- Web Directory: `.next`
- Native plugins enabled

### Environment Variables (`frontend/.env.local`)

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend-url.com

# For local testing:
# NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
```

---

## 📦 Building for Production

### Android APK (Debug)

```bash
cd frontend
npm run build
npm run mobile:sync
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Android APK (Release - Signed)

1. Generate keystore:
   ```bash
   keytool -genkey -v -keystore safejourney.keystore -alias safejourney -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `android/key.properties`:
   ```properties
   storePassword=your_password
   keyPassword=your_password
   keyAlias=safejourney
   storeFile=../safejourney.keystore
   ```

3. Update `android/app/build.gradle`:
   ```gradle
   def keystoreProperties = new Properties()
   def keystorePropertiesFile = rootProject.file('key.properties')
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   
   android {
       signingConfigs {
           release {
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
               storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
               storePassword keystoreProperties['storePassword']
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

4. Build:
   ```bash
   ./gradlew assembleRelease
   ```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### iOS (App Store)

1. Open Xcode: `npm run mobile:ios`
2. Product → Archive
3. Distribute App → App Store Connect
4. Upload and submit for review

---

## 🧪 Testing on Device

### Android

1. **Enable Developer Options** on your Android device:
   - Settings → About Phone → Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings → Developer Options → USB Debugging

3. **Connect device** via USB

4. **Run:**
   ```bash
   npm run mobile:android
   ```
   Select your device in Android Studio

### iOS

1. **Connect iPhone** via USB

2. **Trust computer** on iPhone

3. **In Xcode:**
   - Select your device
   - Sign in with Apple ID
   - Select your development team
   - Click Run

---

## 🔄 Updating the App

After making changes:

```bash
cd frontend

# 1. Build web app
npm run build

# 2. Sync to mobile
npm run mobile:sync

# 3. Open native IDE
npm run mobile:android  # or mobile:ios

# 4. Run from IDE
```

---

## 📱 App Icons and Splash Screens

### Generate Icons

1. Create icons:
   - **Android**: 192x192, 512x512 PNG
   - **iOS**: 1024x1024 PNG

2. Use online tool: https://www.appicon.co/

3. Place in:
   - **Android**: `frontend/android/app/src/main/res/`
   - **iOS**: `frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Generate Splash Screens

Use: https://github.com/ionic-team/capacitor-assets

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

---

## 🐛 Troubleshooting

### "Cannot find module '@capacitor/core'"

```bash
cd frontend
npm install
```

### "Gradle sync failed"

1. Open Android Studio
2. File → Invalidate Caches → Restart
3. File → Sync Project with Gradle Files

### "Location not working"

1. Check permissions in AndroidManifest.xml / Info.plist
2. Grant location permission on device
3. Enable location services on device

### "API calls failing"

1. Check `NEXT_PUBLIC_API_URL` in `.env.local`
2. Ensure backend is running/accessible
3. Check CORS settings in backend
4. For local testing, use your PC's IP, not `localhost`

### "Build fails"

1. Clean build:
   ```bash
   # Android
   cd android
   ./gradlew clean
   
   # iOS
   cd ios
   pod deintegrate
   pod install
   ```

2. Rebuild:
   ```bash
   npm run build
   npm run mobile:sync
   ```

---

## 📚 Additional Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Studio**: https://developer.android.com/studio
- **Xcode**: https://developer.apple.com/xcode/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## ✅ Quick Start Checklist

- [ ] Backend deployed or running locally
- [ ] `frontend/.env.local` created with API URL
- [ ] `npm run build` successful
- [ ] Android Studio / Xcode installed
- [ ] `npm run mobile:add:android` (or `:ios`) completed
- [ ] `npm run mobile:sync` completed
- [ ] Permissions configured in native projects
- [ ] App builds and runs on device/emulator

---

## 🎉 You're Ready!

Your SafeJourney app is now ready for mobile deployment! 

**Next Steps:**
1. Test on device
2. Add app icons and splash screens
3. Build release version
4. Submit to Google Play / App Store

---

**Need Help?** Check the troubleshooting section or review Capacitor documentation.

