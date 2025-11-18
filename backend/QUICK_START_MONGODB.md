# Quick Start: MongoDB Local Connection

## Step-by-Step Guide

### 1. Install MongoDB

**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Complete" installation
4. Check "Install MongoDB as a Service"
5. Check "Install MongoDB Compass"
6. Click "Install"

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Start MongoDB

**Windows:**
- MongoDB starts automatically as a Windows service
- To check/manually start:
  ```bash
  # Open Command Prompt as Administrator
  net start MongoDB
  ```

**macOS/Linux:**
```bash
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### 3. Verify MongoDB is Running

**Check if port 27017 is listening:**
```bash
# Windows
netstat -an | findstr 27017

# macOS/Linux
lsof -i :27017
```

You should see:
```
TCP    0.0.0.0:27017    0.0.0.0:0    LISTENING
```

### 4. Connect with MongoDB Compass

1. **Open MongoDB Compass** (installed with MongoDB, or download from https://www.mongodb.com/try/download/compass)

2. **Connection String:**
   ```
   mongodb://localhost:27017
   ```

3. **Click "Connect"**

4. **You should see:**
   - `admin` database
   - `config` database
   - `local` database

### 5. Update Your .env File

**Create or edit `backend/.env`:**

```env
# MongoDB Connection - Local
MONGODB_URI=mongodb://localhost:27017/safejourney

# Server Configuration
PORT=5010
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3004
```

### 6. Test Connection

**Start your backend:**
```bash
cd backend
npm start
```

**Expected Output:**
```
✅ MongoDB Connected: localhost
📊 Database: safejourney
🚀 Backend running on http://localhost:5010
```

### 7. Verify in MongoDB Compass

After starting your app:
1. **Refresh Compass** (click refresh button)
2. **Look for `safejourney` database**
3. **After first registration/migration, you'll see:**
   - `users` collection
   - `sessions` collection
   - `livesessions` collection
   - `reviews` collection

## Connection Strings

### Local MongoDB (Default)
```
mongodb://localhost:27017/safejourney
```

### Local MongoDB with Authentication
```
mongodb://username:password@localhost:27017/safejourney?authSource=admin
```

### MongoDB Atlas (Cloud)
```
mongodb+srv://username:password@cluster.mongodb.net/safejourney
```

## Common Issues & Solutions

### ❌ "ECONNREFUSED 127.0.0.1:27017"
**Problem:** MongoDB is not running

**Solution:**
```bash
# Windows (as Administrator)
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### ❌ "Authentication failed"
**Problem:** MongoDB has authentication enabled

**Solution 1:** Disable authentication (for development)
- Edit MongoDB config file
- Comment out `security.authorization` line
- Restart MongoDB

**Solution 2:** Use authenticated connection string
```env
MONGODB_URI=mongodb://username:password@localhost:27017/safejourney?authSource=admin
```

### ❌ "Cannot find package 'mongoose'"
**Problem:** Mongoose not installed

**Solution:**
```bash
cd backend
npm install mongoose
```

## Quick Checklist

- [ ] MongoDB installed
- [ ] MongoDB service running (check with `netstat`)
- [ ] MongoDB Compass installed
- [ ] Compass connected to `mongodb://localhost:27017`
- [ ] `.env` file created with `MONGODB_URI=mongodb://localhost:27017/safejourney`
- [ ] `npm install mongoose` completed
- [ ] Backend starts successfully: `npm start`
- [ ] See "✅ MongoDB Connected" in console
- [ ] `safejourney` database appears in Compass

## Testing Your Setup

1. **Start backend:**
   ```bash
   npm start
   ```

2. **Open MongoDB Compass:**
   - Connect to: `mongodb://localhost:27017`
   - You should see the `safejourney` database appear

3. **Test registration:**
   - Register a new user in your app
   - Check Compass: `safejourney` → `users` collection
   - You should see your new user document

## Next Steps

1. ✅ **MongoDB is running**
2. ✅ **Connected in Compass**
3. ✅ **Backend connected to MongoDB**
4. 🔄 **Run migration** (optional): `npm run migrate`
5. 🚀 **Test your application**

You're all set! 🎉
