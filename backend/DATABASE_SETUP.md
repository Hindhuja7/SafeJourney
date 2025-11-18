# Database Setup Guide

This project uses MongoDB with Mongoose for data storage.

## Database Models

The following models have been created:
- **User**: User accounts with name, email, phone, password, and contacts
- **Session**: Authentication sessions with tokens
- **LiveSession**: Live location sharing sessions with location history and SOS alerts
- **Review**: User reviews for routes

## Setup Instructions

### Option 1: Local MongoDB

1. **Install MongoDB**:
   - Windows: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - macOS: `brew install mongodb-community`
   - Linux: Follow [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB**:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   mongod
   ```

3. **Update `.env` file**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/safejourney
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create a MongoDB Atlas account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a cluster**:
   - Click "Build a Database"
   - Choose the free tier (M0)
   - Select your preferred cloud provider and region

3. **Create a database user**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose username/password authentication
   - Save the username and password

4. **Whitelist IP addresses**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add specific IP addresses for production

5. **Get connection string**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<database>` with `safejourney`

6. **Update `.env` file**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safejourney
   ```

### Option 3: Docker MongoDB

1. **Run MongoDB in Docker**:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Update `.env` file**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/safejourney
   ```

## Environment Variables

Add the following to your `.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/safejourney

# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safejourney
```

## Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start MongoDB** (if using local):
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   mongod
   ```

3. **Start the backend**:
   ```bash
   npm start
   ```

The application will automatically:
- Connect to MongoDB on startup
- Create the database if it doesn't exist
- Create indexes for optimal query performance

## Migration from JSON Files

If you have existing data in JSON files (`backend/data/*.json`), you can:

1. **Keep the JSON files as backup** (they won't be used anymore)
2. **Re-register users** (or write a migration script)
3. **The database will be created fresh** on first run

## Troubleshooting

### Connection Error
- Check if MongoDB is running (for local)
- Verify the connection string in `.env`
- Check network access (for Atlas)
- Verify database user credentials

### Authentication Error
- Ensure the database user has proper permissions
- Check username/password in connection string

### Port Already in Use
- Change the port in your `.env` file
- Or stop the process using port 27017

## Notes

- **Passwords are stored in plain text** - In production, use bcrypt for hashing
- **Sessions expire after 7 days** - Update in `authRoutes.js` if needed
- **Database indexes** are automatically created for better performance

## Next Steps

After setting up the database:
1. Update `liveLocationRoutes.js` to use database (TODO)
2. Update `reviewRoutes.js` to use database (TODO)
3. Add password hashing with bcrypt
4. Add data validation middleware
5. Add migration scripts if needed
