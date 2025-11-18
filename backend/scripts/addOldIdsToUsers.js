/**
 * Helper script to add oldId to existing users in MongoDB
 * This is useful if users were created before the migration script was updated
 * 
 * Usage: node scripts/addOldIdsToUsers.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDatabase } from '../config/database.js';

dotenv.config();

async function addOldIds() {
  try {
    await connectDatabase();
    
    console.log('📝 Adding oldId to existing users...\n');
    
    // Get all users without oldId
    const users = await User.find({ oldId: null }).sort({ createdAt: 1 });
    
    if (users.length === 0) {
      console.log('✅ All users already have oldId');
      process.exit(0);
    }
    
    console.log(`Found ${users.length} users without oldId\n`);
    
    // Assign sequential oldId starting from 1
    let oldIdCounter = 1;
    let updated = 0;
    
    for (const user of users) {
      // Check if this oldId is already taken
      let assignedOldId = oldIdCounter;
      while (await User.findOne({ oldId: assignedOldId })) {
        assignedOldId++;
      }
      
      user.oldId = assignedOldId;
      await user.save();
      updated++;
      console.log(`✅ Added oldId ${assignedOldId} to user ${user._id} (${user.email})`);
      oldIdCounter = assignedOldId + 1;
    }
    
    console.log(`\n✅ Updated ${updated} users with oldId`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addOldIds();

