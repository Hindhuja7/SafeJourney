# SafeJourney - Step-by-Step Setup and Testing Guide

## Prerequisites
- Node.js installed (v16 or higher)
- npm installed
- A TomTom API key (get one at https://developer.tomtom.com/)

---

## Step 1: Get TomTom API Key

1. Go to https://developer.tomtom.com/
2. Sign up for a free account or log in
3. Navigate to your dashboard
4. Create a new app or use an existing one
5. Copy your API key

---

## Step 2: Set Up Backend

### 2.1 Navigate to Backend Directory
```bash
cd backend
```

### 2.2 Install Dependencies
```bash
npm install
```

This will install:
- express
- node-fetch
- dotenv
- geolib
- polyline
- cors

### 2.3 Create .env File
Create a file named `.env` in the `backend` directory with the following content:

```
TOMTOM_API_KEY=YOUR_TOMTOM_API_KEY_HERE
PORT=5000
```

**Replace `YOUR_TOMTOM_API_KEY_HERE` with your actual TomTom API key.**

### 2.4 Start Backend Server
```bash
npm start
```

You should see:
```
SafeJourney backend server running on port 5000
Health check: http://localhost:5000/health
```

### 2.5 Test Backend (Optional)
Open a new terminal and test the health endpoint:
```bash
curl http://localhost:5000/health
```

Or open in browser: http://localhost:5000/health

You should see: `{"status":"ok","message":"SafeJourney API is running"}`

**Keep this terminal window open - the backend server needs to keep running.**

---

## Step 3: Set Up Frontend

### 3.1 Open a New Terminal Window
Keep the backend terminal running, and open a new terminal.

### 3.2 Navigate to Frontend Directory
```bash
cd frontend
```

### 3.3 Install Dependencies
```bash
npm install
```

This will install:
- react
- react-dom
- axios
- vite
- @vitejs/plugin-react

### 3.4 Create .env File
Create a file named `.env` in the `frontend` directory with the following content:

```
VITE_API_URL=http://localhost:5000
VITE_TOMTOM_API_KEY=YOUR_TOMTOM_API_KEY_HERE
```

**Replace `YOUR_TOMTOM_API_KEY_HERE` with your actual TomTom API key (same one as backend).**

### 3.5 Start Frontend Development Server
```bash
npm start
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

The browser should automatically open to http://localhost:3000

---

## Step 4: Test the Application

### 4.1 Open the Application
If the browser didn't open automatically, navigate to: **http://localhost:3000**

### 4.2 Enter Test Coordinates

Use these example coordinates for New York City:

**Origin:**
- Latitude: `40.7128`
- Longitude: `-74.0060` (use negative for west)

**Destination:**
- Latitude: `40.7589`
- Longitude: `-73.9851` (use negative for west)

### 4.3 Click "Find Safe Routes"
Click the blue "Find Safe Routes" button.

### 4.4 What to Expect

1. **Loading State**: Button will show "Finding Routes..." while processing
2. **Map Display**: 
   - You should see a TomTom map
   - Origin marker (blue) and destination marker (red)
   - Multiple colored route lines
3. **Route Visualization**:
   - Routes colored by safety: Green (safe) → Yellow (medium) → Red (unsafe)
   - Safest route has a thicker line
4. **Route List**: 
   - Right sidebar shows all routes sorted by safety
   - Safest route marked with "SAFEST" badge
   - Each route shows risk score percentage

### 4.5 Verify It's Working

✅ **Backend is working if:**
- No errors in backend terminal
- Routes appear on the map
- Route list shows in sidebar

✅ **Frontend is working if:**
- Map loads and displays
- Routes are drawn with colors
- Legend appears in bottom-left corner
- Route list appears in right sidebar

---

## Step 5: Troubleshooting

### Problem: Backend won't start
**Solution:**
- Check if port 5000 is already in use
- Verify `.env` file exists and has correct format
- Check that all dependencies installed: `npm install`

### Problem: Frontend shows "Failed to fetch routes"
**Solution:**
- Verify backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env` matches backend port
- Check browser console for detailed error messages
- Verify TomTom API key is correct in backend `.env`

### Problem: Map doesn't load
**Solution:**
- Check `VITE_TOMTOM_API_KEY` in frontend `.env`
- Verify TomTom API key is valid
- Check browser console for errors
- Ensure internet connection is active (TomTom SDK loads from CDN)

### Problem: No routes found
**Solution:**
- Verify coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)
- Check backend terminal for error messages
- Verify TomTom API key has routing permissions
- Try different coordinates in a major city

### Problem: Routes appear but no colors
**Solution:**
- Check browser console for JavaScript errors
- Verify map loaded completely (wait a few seconds)
- Try refreshing the page

---

## Step 6: Test with Different Locations

Try these other test coordinates:

**San Francisco:**
- Origin: `37.7749, -122.4194`
- Destination: `37.7849, -122.4094`

**London:**
- Origin: `51.5074, -0.1278`
- Destination: `51.5155, -0.0922`

**Tokyo:**
- Origin: `35.6762, 139.6503`
- Destination: `35.6812, 139.7671`

---

## Quick Reference Commands

### Backend
```bash
cd backend
npm install          # First time only
npm start            # Start server
```

### Frontend
```bash
cd frontend
npm install          # First time only
npm start            # Start dev server
```

### Stop Servers
- Press `Ctrl+C` in each terminal window to stop the servers

---

## Expected File Structure

```
SafeJourney/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes.js
│   │   ├── tomtom.js
│   │   └── scoring.js
│   ├── package.json
│   └── .env          (create this)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Map.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── App.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env          (create this)
└── SETUP_GUIDE.md
```

---

## Success Indicators

✅ **Everything is working correctly if:**
1. Backend server starts without errors
2. Frontend dev server starts without errors
3. Map loads in browser
4. Entering coordinates and clicking "Find Safe Routes" shows:
   - Multiple colored route lines on map
   - Route list in sidebar
   - Safest route highlighted
   - Legend visible on map

If all of these work, your SafeJourney application is successfully running! 🎉

