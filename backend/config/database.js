import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safejourney';

/**
 * Connect to MongoDB
 */
export async function connectDatabase() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    // Set connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    await mongoose.connect(MONGODB_URI, options);

    const db = mongoose.connection;
    
    // Connection event handlers
    db.on('connected', () => {
      console.log('✅ MongoDB Connected:', db.host);
      console.log('📊 Database:', db.name);
    });

    db.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    db.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    console.log('✅ MongoDB connection established');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDatabase() {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
    throw error;
  }
}

export default { connectDatabase, disconnectDatabase };

