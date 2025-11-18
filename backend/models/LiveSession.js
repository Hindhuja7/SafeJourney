import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  address: {
    type: String,
    default: null
  }
}, { _id: false });

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
}, { _id: false });

const sosAlertSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: false
  },
  checkInIntervalMinutes: {
    type: Number,
    enum: [2, 5, 10, 20],
    default: 5
  },
  nextCheckIn: {
    type: Date,
    default: null
  },
  lastCheckIn: {
    type: Date,
    default: null
  },
  checkInHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    isSafe: {
      type: Boolean,
      required: true
    },
    location: {
      type: locationSchema,
      default: null
    }
  }],
  emergencyTriggered: {
    type: Boolean,
    default: false
  },
  emergencyTriggeredAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const liveSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  selectedContacts: {
    type: [contactSchema],
    default: []
  },
  updateIntervalMinutes: {
    type: Number,
    required: true,
    default: 5
  },
  batteryPercent: {
    type: Number,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  stoppedAt: {
    type: Date,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  locations: {
    type: [locationSchema],
    default: []
  },
  currentLocation: {
    type: locationSchema,
    default: null
  },
  sosAlert: {
    type: sosAlertSchema,
    default: null
  },
  lastSmsSent: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
liveSessionSchema.index({ userId: 1, isActive: 1 });
liveSessionSchema.index({ sessionId: 1 });

const LiveSession = mongoose.model('LiveSession', liveSessionSchema);

export default LiveSession;

