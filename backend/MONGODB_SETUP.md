# MongoDB Local Setup Guide

This guide explains how to set up MongoDB locally, connect via MongoDB Compass, and configure your application.

## Step 1: Install MongoDB

### Windows

1. **Download MongoDB Community Server**:
   - Go to: https://www.mongodb.com/try/download/community
   - Select:
     - Version: Latest (or 7.0)
     - Platform: Windows
     - Package: MSI
   - Click "Download"

2. **Install MongoDB**:
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service"
   - Check "Install MongoDB Compass" (GUI tool)
   - Click "Install"

3. **Verify Installation**:
   - MongoDB should start automatically as a Windows service
   - Open Command Prompt and run:
     ```bash
     mongo --version
     ```
     Or:
     ```bash
     mongod --version
     ```

### macOS

```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)

```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create list file
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Step 2: Start MongoDB Service

### Windows

MongoDB should start automatically as a Windows service. If not:

1. **Open Services**:
   - Press `Win + R`
   - Type `services.msc`
   - Press Enter

2. **Find MongoDB Service**:
   - Look for "MongoDB" or "MongoDB Server"
   - Right-click → "Start" (if stopped)

OR use Command Prompt as Administrator:
```bash
net start MongoDB
```

### macOS/Linux

```bash
# Start MongoDB
brew services start mongodb-community  # macOS
# OR
sudo systemctl start mongod           # Linux
```

## Step 3: Verify MongoDB is Running

### Check if MongoDB is running on default port (27017)

Open a new terminal and run:
```bash
# Windows (Command Prompt)
netstat -an | findstr 27017

# macOS/Linux
lsof -i :27017
# OR
netstat -an | grep 27017
```

You should see something like:
```
TCP    0.0.0.0:27017    0.0.0.0:0    LISTENING
```

## Step 4: Connect Using MongoDB Compass

### If MongoDB Compass was installed:

1. **Open MongoDB Compass**:
   - Search for "MongoDB Compass" in Start Menu (Windows) or Applications (macOS)
   - Or download from: https://www.mongodb.com/try/download/compass

2. **Connect to Local MongoDB**:
   - Connection String: `mongodb://localhost:27017`
   - OR click "Fill in connection fields individually":
     - Host: `localhost`
     - Port: `27017`
     - Authentication: None (default)
   - Click "Connect"

3. **Verify Connection**:
   - You should see:
     - `admin` database (system database)
     - `config` database
     - `local` database
   - No user databases yet (they'll be created when you run your app)

## Step 5: Configure Your Application

### Create/Update `.env` file in `backend/` directory:

```env
# Server Configuration
PORT=5010
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3004

# MongoDB Connection - Local
MONGODB_URI=mongodb://localhost:27017/safejourney

# MongoDB Connection - With Authentication (if you set up auth)
# MONGODB_URI=mongodb://username:password@localhost:27017/safejourney?authSource=admin

# MongoDB Connection - MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safejourney

# TomTom API Key
TOMTOM_API_KEY=your_tomtom_api_key_here

# Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Google Gemini API Key (for AI scoring)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Connection String Formats:

1. **Local MongoDB (No Authentication)**:
   ```
   mongodb://localhost:27017/safejourney
   ```

2. **Local MongoDB (With Authentication)**:
   ```
   mongodb://username:password@localhost:27017/safejourney?authSource=admin
   ```

3. **MongoDB Atlas (Cloud)**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/safejourney
   ```

## Step 6: Test the Connection

### Start your backend:

```bash
cd backend
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
📊 Database: safejourney
🚀 Backend running on http://localhost:5010
```

### If connection fails:

**Error: "MongoServerError: connect ECONNREFUSED 127.0.0.1:27017"**
- **Solution**: MongoDB is not running
  - Start MongoDB service (see Step 2)
  - Verify with: `netstat -an | findstr 27017` (Windows) or `lsof -i :27017` (macOS/Linux)

**Error: "MongoServerError: Authentication failed"**
- **Solution**: You have authentication enabled
  - Either remove authentication from MongoDB
  - OR use authenticated connection string in `.env`

**Error: "MongoParseError: Invalid connection string"**
- **Solution**: Check your `MONGODB_URI` format in `.env`
  - Should be: `mongodb://localhost:27017/safejourney`
  - No extra spaces or quotes

## Step 7: Verify Database in Compass

After running your app:

1. **Refresh MongoDB Compass**
2. **Check for `safejourney` database**:
   - You should see a new database called `safejourney`
3. **Check Collections**:
   - After migration or first user registration, you'll see:
     - `users` collection
     - `sessions` collection
     - `livesessions` collection
     - `reviews` collection

## Step 8: Run Migration (Optional)

To migrate existing JSON data to MongoDB:

```bash
cd backend
npm run migrate
```

This will:
- Read all JSON files from `data/` directory
- Import them into MongoDB
- Create the database and collections
- Preserve all relationships

## Troubleshooting

### MongoDB Service Won't Start (Windows)

1. **Check MongoDB logs**:
   - Go to: `C:\Program Files\MongoDB\Server\7.0\log\mongod.log`
   - Look for error messages

2. **Common issues**:
   - **Port 27017 already in use**: Another service is using this port
     ```bash
     # Find what's using the port
     netstat -ano | findstr 27017
     # Kill the process (replace PID with actual process ID)
     taskkill /PID <PID> /F
     ```
   
   - **Data directory locked**: MongoDB data directory is locked
     - Stop MongoDB service
     - Delete `mongod.lock` file from data directory
     - Start MongoDB service again

### MongoDB Not Found in Command Line

**Windows**:
- Add MongoDB to PATH:
  - MongoDB is usually installed at: `C:\Program Files\MongoDB\Server\7.0\bin`
  - Add this to your system PATH environment variable

**macOS/Linux**:
```bash
# Verify installation
which mongod
which mongo

# If not found, add to PATH or reinstall
```

### Connection Works in Compass But Not in App

1. **Check `.env` file**:
   - Make sure `MONGODB_URI` is correct
   - No quotes around the URI
   - No trailing spaces

2. **Check if backend is reading `.env`**:
   - Make sure `dotenv.config()` is called before using environment variables

3. **Restart the backend**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then start again
   npm start
   ```

## Quick Reference

### MongoDB Connection Strings:

| Type | Connection String |
|------|------------------|
| Local (No Auth) | `mongodb://localhost:27017/safejourney` |
| Local (With Auth) | `mongodb://user:pass@localhost:27017/safejourney?authSource=admin` |
| Atlas (Cloud) | `mongodb+srv://user:pass@cluster.mongodb.net/safejourney` |

### Default MongoDB Settings:

- **Host**: `localhost` or `127.0.0.1`
- **Port**: `27017`
- **Database**: `safejourney` (created automatically)
- **Authentication**: None (by default)

### Useful Commands:

```bash
# Check MongoDB status (Windows)
sc query MongoDB

# Start MongoDB (Windows)
net start MongoDB

# Stop MongoDB (Windows)
net stop MongoDB

# Check if MongoDB is running
netstat -an | findstr 27017  # Windows
lsof -i :27017                # macOS/Linux

# MongoDB Compass Connection
mongodb://localhost:27017
```

## Next Steps

After MongoDB is set up:

1. ✅ **Start MongoDB service**
2. ✅ **Connect in MongoDB Compass** (`mongodb://localhost:27017`)
3. ✅ **Update `.env` file** with `MONGODB_URI=mongodb://localhost:27017/safejourney`
4. ✅ **Start backend**: `npm start`
5. ✅ **Verify connection** in console output
6. ✅ **Run migration**: `npm run migrate` (optional)
7. ✅ **Test your app** - register/login to create first user

Your MongoDB is now ready to use! 🎉
