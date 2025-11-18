# Database Migration Guide

This guide explains how to migrate your existing JSON file data to MongoDB.

## Prerequisites

1. **MongoDB must be running** (local or Atlas)
2. **Backup your data** (copy `backend/data/` folder)
3. **Set up `.env` file** with `MONGODB_URI`

## Quick Start

1. **Set up MongoDB connection** in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/safejourney
   ```

2. **Run the migration**:
   ```bash
   npm run migrate
   ```

## Migration Process

The migration script will:

1. **Connect to MongoDB** (uses `MONGODB_URI` from `.env`)
2. **Migrate Users** from `data/users.json`
   - Converts numeric IDs to MongoDB ObjectIds
   - Preserves email, phone, name, password, contacts
   - Skips duplicates (by email/phone)
3. **Migrate Sessions** from `data/sessions.json`
   - Links to migrated users via ObjectId
   - Only migrates non-expired sessions
4. **Migrate Live Sessions** from `data/liveSessions.json`
   - Preserves location history
   - Migrates SOS alert data
   - Maintains session relationships
5. **Migrate Reviews** from `data/reviews.json`
   - Links to migrated users
   - Preserves route and location data

## Important Notes

### ID Conversion
- **Old system**: Used numeric IDs (1, 2, 3...)
- **New system**: Uses MongoDB ObjectIds
- **Migration**: Creates mapping between old and new IDs
- **Result**: All relationships are preserved

### Duplicate Handling
- Users: Skipped if email/phone already exists
- Sessions: Skipped if token already exists
- Reviews: All migrated (no duplicates check)

### Safe to Run Multiple Times
- The script is **idempotent** (safe to run multiple times)
- It will skip existing records
- Won't create duplicates

### Clearing Existing Data
To clear existing MongoDB data before migration, set:
```env
CLEAR_EXISTING=true
```
⚠️ **Warning**: This will delete all existing data in MongoDB!

## Migration Output

The script provides detailed output:
- ✅ Successful migrations
- ⏭️ Skipped records (duplicates or missing references)
- ❌ Errors (logged but won't stop migration)
- 📊 Summary statistics

## Example Output

```
🚀 Starting MongoDB Migration...

✅ Connected to MongoDB

📦 Migrating Users...
   ✅ Migrated user 1 -> 507f1f77bcf86cd799439011 (user@example.com)
   ✅ Migrated user 2 -> 507f1f77bcf86cd799439012 (admin@example.com)
   ✅ Users migration complete: 2 migrated, 0 skipped

📦 Migrating Sessions...
   ✅ Migrated session for user 1
   ✅ Sessions migration complete: 1 migrated, 0 skipped

📦 Migrating Live Sessions...
   ✅ Migrated live session session_xxx for user 1
   ✅ Live Sessions migration complete: 1 migrated, 0 skipped

📦 Migrating Reviews...
   ✅ Migrated review review_xxx for user 2
   ✅ Reviews migration complete: 1 migrated, 0 skipped

✅ Migration complete!

📊 Summary:
   - User ID mappings: 2

✅ Disconnected from MongoDB
```

## Troubleshooting

### MongoDB Connection Error
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env`
- For Atlas: Check network access settings

### Missing User References
- If reviews/live sessions reference users that don't exist, they'll be skipped
- Check the skipped count in the output

### Migration Fails Partway
- The script can be run again safely
- It will skip already migrated records
- Check error messages for specific issues

## After Migration

1. **Test the application**:
   ```bash
   npm start
   ```

2. **Verify data**:
   - Check users can log in
   - Verify reviews are visible
   - Test live location features

3. **Keep JSON files as backup** (recommended):
   - Don't delete `backend/data/*.json` files yet
   - Keep them as backup until you confirm everything works

## Rollback

If you need to rollback:
1. Stop the backend
2. Delete MongoDB database or collections
3. Restore from JSON file backup
4. The backend will work with JSON files if MongoDB connection fails (if you restore old code)

## Need Help?

- Check MongoDB connection: `npm start` should show connection status
- Review migration logs for specific errors
- Verify `.env` file has correct `MONGODB_URI`
