@echo off
REM SafeJourney Mobile Setup Script for Windows
REM This script helps set up mobile development environment

echo.
echo 🚀 SafeJourney Mobile Setup
echo ============================
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js 16+ first.
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Check if in frontend directory
if not exist "package.json" (
    echo 📁 Moving to frontend directory...
    cd frontend
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ frontend directory not found
        exit /b 1
    )
)

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

REM Check Capacitor
npm list @capacitor/core >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 📦 Installing Capacitor...
    call npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/geolocation @capacitor/app @capacitor/status-bar
)

REM Build web app
echo.
echo 🔨 Building web app...
call npm run build

REM Check for .env.local
if not exist ".env.local" (
    echo.
    echo ⚠️  .env.local not found!
    echo Creating .env.local with default values...
    echo NEXT_PUBLIC_API_URL=http://localhost:5000 > .env.local
    echo.
    echo 📝 Please edit .env.local and set your backend URL:
    echo    - For local: http://localhost:5000
    echo    - For production: https://your-backend-url.com
    echo    - For mobile testing: http://YOUR_PC_IP:5000
    echo.
    pause
)

REM Add Android platform
echo.
echo 📱 Adding Android platform...
call npm run mobile:add:android

REM Sync Capacitor
echo.
echo 🔄 Syncing Capacitor...
call npm run mobile:sync

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Configure permissions in android/app/src/main/AndroidManifest.xml
echo 2. Run 'npm run mobile:android' to open Android Studio
echo 3. Build and run from Android Studio
echo.
pause

