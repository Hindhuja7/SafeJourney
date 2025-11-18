import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Index for finding active sessions
sessionSchema.index({ userId: 1, expiresAt: 1 });

// Method to check if session is expired
sessionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Static method to clean up expired sessions
sessionSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({ expiresAt: { $lt: new Date() } });
  return result.deletedCount;
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;

