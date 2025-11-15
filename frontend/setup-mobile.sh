#!/bin/bash

# SafeJourney Mobile Setup Script
# This script helps set up mobile development environment

echo "🚀 SafeJourney Mobile Setup"
echo "============================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if in frontend directory
if [ ! -f "package.json" ]; then
    echo "📁 Moving to frontend directory..."
    cd frontend || exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check Capacitor
if ! npm list @capacitor/core &> /dev/null; then
    echo ""
    echo "📦 Installing Capacitor..."
    npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/geolocation @capacitor/app @capacitor/status-bar
fi

# Build web app
echo ""
echo "🔨 Building web app..."
npm run build

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚠️  .env.local not found!"
    echo "Creating .env.local with default values..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
    echo ""
    echo "📝 Please edit .env.local and set your backend URL:"
    echo "   - For local: http://localhost:5000"
    echo "   - For production: https://your-backend-url.com"
    echo "   - For mobile testing: http://YOUR_PC_IP:5000"
    echo ""
    read -p "Press Enter to continue after editing .env.local..."
fi

# Ask which platform to add
echo ""
echo "Which platform would you like to add?"
echo "1) Android"
echo "2) iOS (Mac only)"
echo "3) Both"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📱 Adding Android platform..."
        npm run mobile:add:android
        echo ""
        echo "✅ Android platform added!"
        echo "Run 'npm run mobile:android' to open in Android Studio"
        ;;
    2)
        if [[ "$OSTYPE" != "darwin"* ]]; then
            echo "❌ iOS development requires macOS"
            exit 1
        fi
        echo ""
        echo "📱 Adding iOS platform..."
        npm run mobile:add:ios
        echo ""
        echo "✅ iOS platform added!"
        echo "Run 'npm run mobile:ios' to open in Xcode"
        ;;
    3)
        echo ""
        echo "📱 Adding Android platform..."
        npm run mobile:add:android
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo ""
            echo "📱 Adding iOS platform..."
            npm run mobile:add:ios
            echo ""
            echo "✅ Both platforms added!"
            echo "Run 'npm run mobile:android' or 'npm run mobile:ios'"
        else
            echo ""
            echo "⚠️  iOS requires macOS. Only Android was added."
        fi
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Sync Capacitor
echo ""
echo "🔄 Syncing Capacitor..."
npm run mobile:sync

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure permissions in native projects (see MOBILE_DEPLOYMENT_COMPLETE.md)"
echo "2. Run 'npm run mobile:android' or 'npm run mobile:ios'"
echo "3. Build and run from Android Studio / Xcode"
echo ""

