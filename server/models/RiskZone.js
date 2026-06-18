const mongoose = require('mongoose');

const riskZoneSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Geographic center of the zone
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat] — GeoJSON standard
      required: true
    }
  },

  // Zone metadata
  zoneType: {
    type: String,
    enum: ['hard_brake', 'speed_violation', 'distraction', 'sharp_turn', 'general_risk'],
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Memory — how many times has this been triggered
  eventCount: { type: Number, default: 1 },
  lastTriggered: { type: Date, default: Date.now },
  firstSeen: { type: Date, default: Date.now },

  // AI-generated warning message
  warningMessage: {
    type: String,
    default: 'Risk zone detected from your driving history'
  },

  // Zone radius in meters
  radiusMeters: { type: Number, default: 50 },

  // Reference trips that contributed to this zone
  tripIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }]
}, { timestamps: true });

// Geospatial index for location queries
riskZoneSchema.index({ location: '2dsphere' });
riskZoneSchema.index({ user: 1, zoneType: 1 });

// Update risk level based on event count
riskZoneSchema.pre('save', function(next) {
  if (this.eventCount >= 8) this.riskLevel = 'critical';
  else if (this.eventCount >= 5) this.riskLevel = 'high';
  else if (this.eventCount >= 3) this.riskLevel = 'medium';
  else this.riskLevel = 'low';

  // Generate dynamic warning message
  const messages = {
    hard_brake: `You've braked hard here ${this.eventCount} time${this.eventCount > 1 ? 's' : ''}. Slow down early.`,
    speed_violation: `Speed limit exceeded here ${this.eventCount} time${this.eventCount > 1 ? 's' : ''}. Watch your speed.`,
    distraction: `Distraction detected here ${this.eventCount} time${this.eventCount > 1 ? 's' : ''}. Stay focused.`,
    sharp_turn: `Sharp turn ahead — you've struggled here ${this.eventCount} time${this.eventCount > 1 ? 's' : ''}.`,
    general_risk: `Risk zone from ${this.eventCount} previous incident${this.eventCount > 1 ? 's' : ''}.`
  };
  this.warningMessage = messages[this.zoneType] || messages.general_risk;
  next();
});

module.exports = mongoose.model('RiskZone', riskZoneSchema);
