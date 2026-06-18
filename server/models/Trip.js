const mongoose = require('mongoose');

const riskEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['hard_brake', 'sudden_acceleration', 'sharp_turn', 'speed_violation', 'distraction'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  speed: Number,
  timestamp: { type: Date, default: Date.now },
  description: String
}, { _id: true });

const waypointSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  speed: Number,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String
  },
  endLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },

  // Trip metrics
  distanceKm: { type: Number, default: 0 },
  avgSpeedKmh: { type: Number, default: 0 },
  maxSpeedKmh: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 0 },

  // Safety
  safetyScore: { type: Number, min: 0, max: 100, default: 100 },
  riskEvents: [riskEventSchema],
  waypoints: [waypointSchema],

  // Derived stats
  hardBrakes: { type: Number, default: 0 },
  speedViolations: { type: Number, default: 0 },
  brakingScore: { type: Number, default: 100 },
  speedScore: { type: Number, default: 100 },
  laneScore: { type: Number, default: 100 }
}, { timestamps: true });

// Calculate safety score before saving
tripSchema.pre('save', function(next) {
  if (this.riskEvents && this.riskEvents.length > 0) {
    const penalties = {
      hard_brake: { low: 3, medium: 6, high: 12 },
      sudden_acceleration: { low: 2, medium: 5, high: 10 },
      sharp_turn: { low: 2, medium: 5, high: 10 },
      speed_violation: { low: 4, medium: 8, high: 15 },
      distraction: { low: 5, medium: 10, high: 20 }
    };
    let totalPenalty = 0;
    this.hardBrakes = 0;
    this.speedViolations = 0;
    this.riskEvents.forEach(e => {
      totalPenalty += (penalties[e.type]?.[e.severity] || 5);
      if (e.type === 'hard_brake') this.hardBrakes++;
      if (e.type === 'speed_violation') this.speedViolations++;
    });
    this.safetyScore = Math.max(0, 100 - totalPenalty);
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
