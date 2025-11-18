# MongoDB Connection Guide - Local & Atlas

## Your Current Setup

You have **MongoDB Atlas** (cloud) connection in your `.env` file. Here's how to use it or switch to local MongoDB.

## Option 1: MongoDB Atlas (Cloud) - Already Configured ✅

### Current Connection String (from your .env):

```
MONGODB_URI=mongodb+srv://
```

### ⚠️ Fix Required:

**Issue 1:** Angle brackets around password `<loQmwowkcphu03bb>` should be removed  
**Issue 2:** Database name `safejourney` should be added

### ✅ Corrected Connection String:

```env
MONGODB_URI=mongodb+srv://gunavardhanyakkati_db_user:loQmwowkcphu03bb@cluster0.kldd9cw.mongodb.net/safejourney?appName=Cluster0
```

**Steps to Fix:**

1. **Edit `backend/.env` file**
2. **Update MONGODB_URI line:**
   ```env
   # Remove angle brackets around password
   # Add database name at the end: /safejourney
   MONGODB_URI=mongodb+srv://gunavardhanyakkati_db_user:loQmwowkcphu03bb@cluster0.kldd9cw.mongodb.net/safejourney?appName=Cluster0
   ```

3. **Connect in MongoDB Compass:**
   ```
   mongodb+srv://gunavardhanyakkati_db_user:loQmwowkcphu03bb@cluster0.kldd9cw.mongodb.net/safejourney?appName=Cluster0
   ```

### Connect MongoDB Compass to Atlas:

1. **Open MongoDB Compass**
2. **Paste this connection string:**
   ```
   mongodb+srv://gunavardhanyakkati_db_user:loQmwowkcphu03bb@cluster0.kldd9cw.mongodb.net/?appName=Cluster0
   ```
3. **Fill in password:** `loQmwowkcphu03bb`
4. **Click "Connect"**
5. **Select `safejourney` database** (or it will be created automatically)

---

## Option 2: Local MongoDB (localhost)

### Install MongoDB Locally:

**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Install with default settings
3. Check "Install MongoDB as a Service"
4. Check "Install MongoDB Compass"

### Start MongoDB:

**Windows (as Administrator):**
```bash
net start MongoDB
```

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

### Update .env for Local:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/safejourney
```

### Connect MongoDB Compass to Local:

```
mongodb://localhost:27017
```

---

## Quick Comparison

| Feature | Local MongoDB | MongoDB Atlas |
|---------|--------------|---------------|
| **Connection String** | `mongodb://localhost:27017/safejourney` | `mongodb+srv://user:pass@cluster.mongodb.net/safejourney` |
| **Compass Connection** | `mongodb://localhost:27017` | `mongodb+srv://user:pass@cluster.mongodb.net` |
| **Setup** | Install locally | Free cloud account |
| **Access** | Only on your machine | Access from anywhere |
| **Performance** | Fast (local network) | Depends on internet |

---

## Verify Connection

### In Your App:

1. **Update `.env` file** (fix the connection string)
2. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Expected output:**
   ```
   ✅ MongoDB Connected: cluster0-shard-00-02.kldd9cw.mongodb.net
   📊 Database: safejourney
   🚀 Backend running on http://localhost:5010
   ```

### In MongoDB Compass:

1. **Open MongoDB Compass**
2. **Connect** (use connection string from above)
3. **Look for `safejourney` database**
4. **After running your app, you'll see collections:**
   - `users`
   - `sessions`
   - `livesessions`
   - `reviews`

---

## Troubleshooting

### ❌ "Authentication failed"

**Problem:** Wrong password or username

**Solution:**
1. Check your Atlas password in MongoDB Atlas dashboard
2. Make sure there are **no angle brackets** around password
3. URL encode special characters in password if needed

### ❌ "ECONNREFUSED" (for local MongoDB)

**Problem:** MongoDB service not running

**Solution:**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### ❌ "Connection timeout" (for Atlas)

**Problem:** Network access not configured

**Solution:**
1. Go to MongoDB Atlas dashboard
2. Click "Network Access"
3. Add your IP address or click "Allow Access from Anywhere" (0.0.0.0/0)

### ❌ "Database name missing"

**Problem:** Connection string doesn't specify database

**Solution:**
- Add `/safejourney` at the end of connection string:
  ```
  mongodb+srv://user:pass@cluster.net/safejourney
  ```

---

## Recommended Setup

### For Development (Local):
```env
MONGODB_URI=mongodb://localhost:27017/safejourney
```

### For Production (Atlas):
```env
MONGODB_URI=mongodb+srv://gunavardhanyakkati_db_user:loQmwowkcphu03bb@cluster0.kldd9cw.mongodb.net/safejourney?appName=Cluster0
```

---

## Next Steps

1. ✅ **Fix your `.env` file** (remove angle brackets, add database name)
2. ✅ **Connect MongoDB Compass** (use connection string)
3. ✅ **Start backend:** `npm start`
4. ✅ **Verify connection** in console output
5. ✅ **Run migration** (optional): `npm run migrate`

You're all set! 🎉
