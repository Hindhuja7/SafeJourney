# How to Run SafeJourney

## Option 1: Run on PC (Development) 💻

### Step 1: Start the Backend Server

Open **Terminal/PowerShell** in the project root:

```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
npm install

# Start backend server
npm start
```

Backend will run on: **http://localhost:5000**

### Step 2: Start the Frontend (in a NEW terminal)

Open a **NEW Terminal/PowerShell** window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Start frontend development server
npm run dev
```

Frontend will run on: **http://localhost:3000**

### Step 3: Open in Browser

Open your browser and go to: **http://localhost:3000**

---

## Option 2: Run on Mobile (Testing) 📱

### Method A: Access from Mobile on Same WiFi

1. **Find your PC's IP address:**
   - **Windows**: Open PowerShell and run:
     ```powershell
     ipconfig
     ```
     Look for "IPv4 Address" (e.g., `192.168.1.100`)
   
   - **Mac/Linux**: Run:
     ```bash
     ifconfig
     ```
     Look for "inet" address

2. **Start both servers** (Backend + Frontend) on your PC as shown above

3. **On your mobile device:**
   - Make sure your phone is on the **same WiFi network** as your PC
   - Open browser and go to: `http://YOUR_PC_IP:3000`
     - Example: `http://192.168.1.100:3000`

4. **Important**: Update backend URL in frontend code:
   - Edit `frontend/components/LiveLocationShare.js`
   - Change `http://localhost:5000` to `http://YOUR_PC_IP:5000`
   - Also update in `frontend/pages/index.js` if needed

### Method B: Deploy to Internet (Best for Mobile)

1. **Deploy Backend:**
   - Deploy to services like:
     - **Heroku**: `heroku create safejourney-backend`
     - **Railway**: https://railway.app
     - **Render**: https://render.com
   
   - Update CORS in `backend/index.js`:
     ```javascript
     origin: "https://your-frontend-url.com"
     ```

2. **Deploy Frontend:**
   - **Vercel** (Recommended for Next.js):
     ```bash
     cd frontend
     npm install -g vercel
     vercel
     ```
   - Or **Netlify**, **Firebase Hosting**, etc.

3. **Access on Mobile:**
   - Open the deployed URL on your mobile browser
   - Works from anywhere with internet!

---

## Quick Start Commands

### First Time Setup:
```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### Daily Development:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## Testing on Mobile (Local Network)

### Step-by-Step:

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Find Your PC IP:**
   ```powershell
   # Windows PowerShell
   ipconfig | findstr IPv4
   ```

4. **Update Frontend Code:**
   - In `frontend/components/LiveLocationShare.js`, line ~40:
     ```javascript
     // Change from:
     const res = await axios.get(`http://localhost:5000/api/live-location/contacts/${userId}`);
     
     // To:
     const res = await axios.get(`http://YOUR_IP:5000/api/live-location/contacts/${userId}`);
     ```
   - Do the same for all `http://localhost:5000` references

5. **Access on Mobile:**
   - Open browser on phone
   - Go to: `http://YOUR_IP:3000`

---

## Troubleshooting

### Backend won't start?
- Check if port 5000 is already in use
- Try: `netstat -ano | findstr :5000` (Windows)
- Kill the process or change port in `backend/index.js`

### Frontend won't start?
- Check if port 3000 is already in use
- Try: `netstat -ano | findstr :3000` (Windows)
- Kill the process or change port: `npm run dev -- -p 3001`

### Can't access from mobile?
- Make sure PC and phone are on same WiFi
- Check Windows Firewall - allow Node.js through firewall
- Try disabling firewall temporarily to test
- Make sure backend CORS allows your IP

### Location not working on mobile?
- Must use HTTPS (or localhost) for geolocation
- Grant location permissions in browser
- Test on real device, not emulator

---

## Recommended Setup

**For Development:**
- Run on PC: `localhost:3000`
- Test features, debug, develop

**For Mobile Testing:**
- Deploy to Vercel (free)
- Access from mobile browser
- Test PWA installation
- Test location features

**For Production:**
- Deploy backend to cloud (Railway/Render)
- Deploy frontend to Vercel
- Configure CORS properly
- Add app icons for PWA

---

## Next Steps

1. ✅ Run on PC first to test everything works
2. ✅ Deploy to Vercel for mobile testing
3. ✅ Create app icons (192x192, 512x512 PNG)
4. ✅ Test PWA installation on mobile
5. ✅ Test location sharing features

