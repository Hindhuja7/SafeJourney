import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Session from '../models/Session.js';
import LiveSession from '../models/LiveSession.js';
import Review from '../models/Review.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to JSON files
const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LIVE_SESSIONS_FILE = path.join(DATA_DIR, 'liveSessions.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Map numeric IDs to ObjectIds
const userIdMap = new Map(); // old numeric id -> new ObjectId

/**
 * Read JSON file
 */
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`⚠️  File not found: ${filePath}, skipping...`);
      return [];
    }
    throw err;
  }
}

/**
 * Connect to MongoDB
 */
async function connectDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safejourney';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

/**
 * Migrate Users
 */
async function migrateUsers() {
  console.log('\n📦 Migrating Users...');
  
  try {
    const users = await readJSON(USERS_FILE);
    
    if (users.length === 0) {
      console.log('   No users to migrate');
      return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const oldUser of users) {
      try {
        // Skip if missing required fields
        if (!oldUser.name || !oldUser.phone) {
          console.log(`   ⏭️  Skipping user ${oldUser.id} - missing name or phone`);
          skipped++;
          continue;
        }

        // Generate email if missing (use phone-based email)
        let email = oldUser.email;
        if (!email || email.trim() === '') {
          email = `user${oldUser.id}@migrated.safejourney.local`;
          console.log(`   ⚠️  User ${oldUser.id} missing email, generated: ${email}`);
        }

        // Check if user already exists (by email or phone)
        const existingUser = await User.findOne({
          $or: [
            { email: email.trim().toLowerCase() },
            { phone: oldUser.phone.trim() }
          ]
        });

        if (existingUser) {
          console.log(`   ⏭️  Skipping user ${oldUser.id} (${email}) - already exists`);
          userIdMap.set(oldUser.id, existingUser._id);
          skipped++;
          continue;
        }

        // Create new user
        const newUser = new User({
          name: oldUser.name.trim(),
          phone: oldUser.phone.trim(),
          email: email.trim().toLowerCase(),
          password: oldUser.password || 'migrated_password', // Default password for migrated users
          contacts: oldUser.defaultContacts || oldUser.emergencyContacts || [],
          oldId: oldUser.id, // Store old numeric ID for backward compatibility
        });

        await newUser.save();
        userIdMap.set(oldUser.id, newUser._id);
        migrated++;
        console.log(`   ✅ Migrated user ${oldUser.id} -> ${newUser._id} (${email})`);
      } catch (err) {
        console.error(`   ❌ Error migrating user ${oldUser.id}:`, err.message);
      }
    }

    console.log(`   ✅ Users migration complete: ${migrated} migrated, ${skipped} skipped`);
  } catch (err) {
    console.error('❌ Error migrating users:', err);
    throw err;
  }
}

/**
 * Migrate Sessions
 */
async function migrateSessions() {
  console.log('\n📦 Migrating Sessions...');
  
  try {
    const sessions = await readJSON(SESSIONS_FILE);
    
    if (sessions.length === 0) {
      console.log('   No sessions to migrate');
      return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const oldSession of sessions) {
      try {
        const newUserId = userIdMap.get(oldSession.userId);
        
        if (!newUserId) {
          console.log(`   ⏭️  Skipping session for user ${oldSession.userId} - user not found`);
          skipped++;
          continue;
        }

        // Check if session already exists
        const existingSession = await Session.findOne({ token: oldSession.token });
        
        if (existingSession) {
          console.log(`   ⏭️  Skipping session with token ${oldSession.token.substring(0, 10)}... - already exists`);
          skipped++;
          continue;
        }

        // Check if token is still valid (not expired)
        const expiresAt = new Date(oldSession.expiresAt);
        if (expiresAt < new Date()) {
          console.log(`   ⏭️  Skipping expired session for user ${oldSession.userId}`);
          skipped++;
          continue;
        }

        const newSession = new Session({
          token: oldSession.token,
          userId: newUserId,
          expiresAt: expiresAt,
          createdAt: new Date(oldSession.createdAt)
        });

        await newSession.save();
        migrated++;
        console.log(`   ✅ Migrated session for user ${oldSession.userId}`);
      } catch (err) {
        console.error(`   ❌ Error migrating session:`, err.message);
      }
    }

    console.log(`   ✅ Sessions migration complete: ${migrated} migrated, ${skipped} skipped`);
  } catch (err) {
    console.error('❌ Error migrating sessions:', err);
    throw err;
  }
}

/**
 * Migrate Live Sessions
 */
async function migrateLiveSessions() {
  console.log('\n📦 Migrating Live Sessions...');
  
  try {
    const sessions = await readJSON(LIVE_SESSIONS_FILE);
    
    if (sessions.length === 0) {
      console.log('   No live sessions to migrate');
      return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const oldSession of sessions) {
      try {
        const newUserId = userIdMap.get(oldSession.userId);
        
        if (!newUserId) {
          console.log(`   ⏭️  Skipping live session for user ${oldSession.userId} - user not found`);
          skipped++;
          continue;
        }

        // Convert locations to match schema
        const locations = (oldSession.locations || []).map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: new Date(loc.timestamp),
          accuracy: loc.accuracy || null,
          speed: loc.speed || null
        }));

        // Convert SOS alert if exists
        let sosAlert = null;
        if (oldSession.sosAlert) {
          sosAlert = {
            isActive: oldSession.sosAlert.isActive || false,
            checkInIntervalMinutes: oldSession.sosAlert.checkInIntervalMinutes || 5,
            lastCheckIn: oldSession.sosAlert.lastCheckIn ? new Date(oldSession.sosAlert.lastCheckIn) : null,
            nextCheckIn: oldSession.sosAlert.nextCheckIn ? new Date(oldSession.sosAlert.nextCheckIn) : null,
            emergencyTriggered: oldSession.sosAlert.emergencyTriggered || false,
            emergencyTriggeredAt: oldSession.sosAlert.emergencyTriggeredAt ? new Date(oldSession.sosAlert.emergencyTriggeredAt) : null,
            checkInHistory: (oldSession.sosAlert.checkInHistory || []).map(checkIn => ({
              timestamp: new Date(checkIn.timestamp),
              isSafe: checkIn.isSafe,
              location: checkIn.location ? {
                latitude: checkIn.location.latitude,
                longitude: checkIn.location.longitude,
                timestamp: new Date(checkIn.location.timestamp)
              } : null
            })),
            noResponseCountdown: oldSession.sosAlert.noResponseCountdown || null
          };
        }

        // Get current location (last location)
        const currentLocation = locations.length > 0 ? locations[locations.length - 1] : null;

        const newSession = new LiveSession({
          userId: newUserId,
          isActive: oldSession.isActive || false,
          updateIntervalMinutes: oldSession.updateIntervalMinutes || 5,
          selectedContacts: oldSession.selectedContacts || [],
          currentLocation: currentLocation,
          locations: locations,
          sosAlert: sosAlert,
          batteryPercent: oldSession.batteryPercent || null,
          lastSmsSent: oldSession.lastSmsSent ? new Date(oldSession.lastSmsSent) : null,
          startedAt: oldSession.startedAt ? new Date(oldSession.startedAt) : new Date(),
          endedAt: oldSession.stoppedAt ? new Date(oldSession.stoppedAt) : (oldSession.isActive ? null : new Date()),
          createdAt: oldSession.startedAt ? new Date(oldSession.startedAt) : new Date()
        });

        await newSession.save();
        migrated++;
        console.log(`   ✅ Migrated live session ${oldSession.sessionId} for user ${oldSession.userId}`);
      } catch (err) {
        console.error(`   ❌ Error migrating live session ${oldSession.sessionId}:`, err.message);
      }
    }

    console.log(`   ✅ Live Sessions migration complete: ${migrated} migrated, ${skipped} skipped`);
  } catch (err) {
    console.error('❌ Error migrating live sessions:', err);
    throw err;
  }
}

/**
 * Migrate Reviews
 */
async function migrateReviews() {
  console.log('\n📦 Migrating Reviews...');
  
  try {
    const reviews = await readJSON(REVIEWS_FILE);
    
    if (reviews.length === 0) {
      console.log('   No reviews to migrate');
      return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const oldReview of reviews) {
      try {
        const newUserId = userIdMap.get(oldReview.userId);
        
        if (!newUserId) {
          console.log(`   ⏭️  Skipping review for user ${oldReview.userId} - user not found`);
          skipped++;
          continue;
        }

        // Extract route information
        const routeLabel = oldReview.route?.routeLabel || 
                          oldReview.route?.label || 
                          'Unknown Route';
        
        const rating = oldReview.route?.safetyScore || 
                      oldReview.route?.rating || 
                      (oldReview.reviewText ? 3 : 0); // Default rating
        
        // Parse safety incidents
        const safetyIncidents = [];
        if (oldReview.route?.safetyReason) {
          safetyIncidents.push(oldReview.route.safetyReason);
        }
        if (oldReview.route?.reason) {
          safetyIncidents.push(oldReview.route.reason);
        }

        // Get location from proof
        let location = null;
        if (oldReview.proof?.coordinates) {
          location = {
            latitude: oldReview.proof.coordinates.latitude,
            longitude: oldReview.proof.coordinates.longitude
          };
        } else if (oldReview.proof?.finalLocation) {
          location = {
            latitude: oldReview.proof.finalLocation.latitude,
            longitude: oldReview.proof.finalLocation.longitude
          };
        }

        const newReview = new Review({
          userId: newUserId,
          sourceAddress: oldReview.route?.sourceAddress || oldReview.proof?.finalAddress || '',
          destinationAddress: oldReview.route?.destinationAddress || '',
          routeLabel: routeLabel,
          rating: rating,
          comment: oldReview.reviewText || '',
          safetyIncidents: safetyIncidents,
          recommendations: oldReview.route?.recommendations || '',
          location: location,
          createdAt: oldReview.timestamp ? new Date(oldReview.timestamp) : new Date()
        });

        await newReview.save();
        migrated++;
        console.log(`   ✅ Migrated review ${oldReview.id} for user ${oldReview.userId}`);
      } catch (err) {
        console.error(`   ❌ Error migrating review ${oldReview.id}:`, err.message);
      }
    }

    console.log(`   ✅ Reviews migration complete: ${migrated} migrated, ${skipped} skipped`);
  } catch (err) {
    console.error('❌ Error migrating reviews:', err);
    throw err;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting MongoDB Migration...\n');
  
  try {
    // Connect to database
    await connectDatabase();
    
    // Clear existing data (optional - comment out if you want to preserve existing data)
    const clearExisting = process.env.CLEAR_EXISTING === 'true';
    if (clearExisting) {
      console.log('⚠️  CLEAR_EXISTING is set to true. Clearing existing data...');
      await User.deleteMany({});
      await Session.deleteMany({});
      await LiveSession.deleteMany({});
      await Review.deleteMany({});
      console.log('✅ Existing data cleared\n');
    }
    
    // Run migrations in order (dependencies matter)
    await migrateUsers();
    await migrateSessions();
    await migrateLiveSessions();
    await migrateReviews();
    
    console.log('\n✅ Migration complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - User ID mappings: ${userIdMap.size}`);
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run migration
runMigration().catch(console.error);
