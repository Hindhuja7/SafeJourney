import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Store old numeric ID for backward compatibility during migration
  oldId: {
    type: Number,
    default: null,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  contacts: {
    type: [contactSchema],
    default: []
  },
  emergencyContacts: {
    type: [contactSchema],
    default: []
  },
  defaultContacts: {
    type: [contactSchema],
    default: []
  },
  preferences: {
    autoSelectSafest: {
      type: Boolean,
      default: true
    },
    batteryMode: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries (email and phone already indexed via unique: true)
userSchema.index({ oldId: 1 }); // For backward compatibility

const User = mongoose.model('User', userSchema);

export default User;

