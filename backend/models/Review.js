import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  }
}, { _id: false });

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    default: null
  },
  distance: {
    type: Number,
    default: null
  },
  duration: {
    type: Number,
    default: null
  },
  safetyScore: {
    type: Number,
    default: null
  },
  safetyReason: {
    type: String,
    default: null
  },
  sourceAddress: {
    type: String,
    default: null
  },
  destinationAddress: {
    type: String,
    default: null
  }
}, { _id: false });

const proofSchema = new mongoose.Schema({
  finalLocation: {
    type: locationSchema,
    default: null
  },
  finalAddress: {
    type: String,
    default: null
  },
  arrivedAt: {
    type: Date,
    default: Date.now
  },
  coordinates: {
    type: locationSchema,
    default: null
  }
}, { _id: false });

const journeySchema = new mongoose.Schema({
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    default: null
  }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  reviewText: {
    type: String,
    default: ''
  },
  sourceAddress: {
    type: String,
    default: ''
  },
  destinationAddress: {
    type: String,
    default: ''
  },
  routeLabel: {
    type: String,
    default: 'Unknown Route'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  comment: {
    type: String,
    default: ''
  },
  safetyIncidents: {
    type: [String],
    default: []
  },
  location: {
    type: locationSchema,
    default: null
  },
  proof: {
    type: proofSchema,
    default: {}
  },
  route: {
    type: routeSchema,
    default: null
  },
  locationHistory: {
    type: [locationSchema],
    default: []
  },
  totalLocations: {
    type: Number,
    default: 0
  },
  journey: {
    type: journeySchema,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  date: {
    type: String,
    default: function() {
      return new Date().toLocaleDateString();
    }
  },
  time: {
    type: String,
    default: function() {
      return new Date().toLocaleTimeString();
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
reviewSchema.index({ userId: 1, timestamp: -1 });
reviewSchema.index({ sessionId: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

