# Troubleshooting "Failed to fetch routes" Error

## Quick Fixes

### 1. Check if Backend is Running

**Check if backend server is running:**
- Open browser: http://localhost:5000
- Should see: Cannot GET / (this is normal - means server is running)
- If you see "This site can't be reached" → Backend is NOT running

**Start backend:**
```bash
cd backend
npm start
```

You should see: `🚀 Backend running on http://localhost:5000`

---

### 2. Check Backend Route

**Test the route directly:**
```bash
# Using curl (if installed)
curl -X POST http://localhost:5000/api/routes \
  -H "Content-Type: application/json" \
  -d '{"sourceAddress":"Miyapur, Hyderabad","destinationAddress":"LB Nagar, Hyderabad"}'
```

**Or test in browser console:**
```javascript
fetch('http://localhost:5000/api/routes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceAddress: 'Miyapur, Hyderabad',
    destinationAddress: 'LB Nagar, Hyderabad'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

---

### 3. Check CORS Configuration

**Verify CORS in `backend/index.js`:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
}));
```

**If accessing from mobile (different IP), update:**
```javascript
app.use(cors({
  origin: "*", // Allow all origins (for testing only)
  methods: ["GET", "POST"],
  credentials: true
}));
```

---

### 4. Check Browser Console

**Open browser DevTools (F12) and check:**
- Network tab: See if request is being sent
- Console tab: Look for CORS errors or network errors
- Check if request shows as "Failed" or "CORS error"

**Common errors:**
- `CORS policy: No 'Access-Control-Allow-Origin'` → CORS issue
- `Failed to fetch` → Backend not running or network issue
- `404 Not Found` → Route not found

---

### 5. Verify Route Mounting

**Check `backend/index.js`:**
```javascript
app.use("/api", safetyRoutes);  // Should mount at /api
```

**Check `backend/routes/safetyRoutes.js`:**
```javascript
router.post("/routes", ...);  // Route is /routes
```

**Full path should be:** `/api/routes`

---

### 6. Check Port Conflicts

**Windows - Check if port 5000 is in use:**
```powershell
netstat -ano | findstr :5000
```

**If port is in use:**
- Kill the process: `taskkill /PID <process_id> /F`
- Or change port in `backend/index.js`:
  ```javascript
  const PORT = process.env.PORT || 5001; // Change to 5001
  ```
- Update frontend to use new port

---

### 7. Check Backend Logs

**Look at backend terminal for errors:**
- OSRM API errors
- Geocoding errors
- Missing dependencies
- File read errors

**Common backend errors:**
- `Cannot find module` → Run `npm install` in backend
- `EADDRINUSE` → Port already in use
- `ECONNREFUSED` → OSRM service unavailable

---

### 8. Test Backend Health

**Create a test endpoint in `backend/index.js`:**
```javascript
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});
```

**Test in browser:** http://localhost:5000/api/health

---

## Step-by-Step Debugging

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```
   ✅ Should see: "Backend running on http://localhost:5000"

2. **Test Backend Health:**
   - Open: http://localhost:5000/api/health (if you added it)
   - Or: http://localhost:5000 (should show "Cannot GET /")

3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   ✅ Should see: "Ready on http://localhost:3000"

4. **Open Browser:**
   - Go to: http://localhost:3000
   - Open DevTools (F12)
   - Go to Network tab
   - Try to fetch routes
   - Check the request:
     - Status: Should be 200 (success) or 400/500 (error)
     - If "Failed" → Backend not running or CORS issue

5. **Check Console:**
   - Look for error messages
   - Check if axios request is being made
   - Verify the URL is correct

---

## Common Solutions

### Solution 1: Backend Not Running
```bash
cd backend
npm install  # If first time
npm start
```

### Solution 2: CORS Error
Update `backend/index.js`:
```javascript
app.use(cors({
  origin: "*", // For testing
  methods: ["GET", "POST"],
  credentials: true
}));
```

### Solution 3: Port Already in Use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Solution 4: Missing Dependencies
```bash
cd backend
npm install
```

### Solution 5: Network Error
- Check firewall settings
- Disable VPN if active
- Try different network

---

## Still Not Working?

1. **Check backend terminal** for specific error messages
2. **Check browser console** for detailed error
3. **Verify both servers are running** (backend on 5000, frontend on 3000)
4. **Test backend directly** using curl or Postman
5. **Check if OSRM service is accessible** (http://router.project-osrm.org)

---

## Quick Test Script

Add this to `backend/index.js` to test:

```javascript
// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!", timestamp: new Date() });
});
```

Then test: http://localhost:5000/api/test

