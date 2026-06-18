const RiskZone = require('../models/RiskZone');

/**
 * AI Risk Memory Engine
 * 
 * When a risk event occurs at a location:
 * 1. Check if a risk zone exists within MERGE_RADIUS meters
 * 2. If yes — increment event count (reinforces the memory)
 * 3. If no — create a new zone (learns new danger spot)
 * 
 * The zone's risk level and warning message auto-update based on frequency.
 */

const MERGE_RADIUS_METERS = 80; // zones within 80m are considered the same spot

async function updateRiskZone({ userId, location, eventType, severity, tripId }) {
  try {
    const { lat, lng } = location;

    // Find existing zone nearby (GeoJSON: coordinates are [lng, lat])
    const existingZone = await RiskZone.findOne({
      user: userId,
      zoneType: eventType,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: MERGE_RADIUS_METERS
        }
      }
    });

    if (existingZone) {
      // Reinforce existing memory
      existingZone.eventCount += 1;
      existingZone.lastTriggered = new Date();
      if (tripId && !existingZone.tripIds.includes(tripId)) {
        existingZone.tripIds.push(tripId);
      }
      await existingZone.save(); // pre-save hook recalculates risk level & message
      return existingZone;
    } else {
      // Create new memory zone
      const newZone = await RiskZone.create({
        user: userId,
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        zoneType: eventType,
        eventCount: 1,
        tripIds: tripId ? [tripId] : []
      });
      return newZone;
    }
  } catch (err) {
    // Don't throw — risk zone update is non-critical to trip recording
    console.error('Risk zone update error:', err.message);
    return null;
  }
}

/**
 * Calculate real-time safety score for a live drive segment.
 * Returns 0-100 where 100 is perfect.
 */
function calculateSegmentScore(events) {
  if (!events || events.length === 0) return 100;

  const weights = {
    hard_brake: { low: 3, medium: 6, high: 12 },
    sudden_acceleration: { low: 2, medium: 4, high: 8 },
    sharp_turn: { low: 2, medium: 5, high: 10 },
    speed_violation: { low: 4, medium: 8, high: 15 },
    distraction: { low: 5, medium: 10, high: 20 }
  };

  const penalty = events.reduce((total, e) => {
    return total + (weights[e.type]?.[e.severity] || 5);
  }, 0);

  return Math.max(0, 100 - penalty);
}

/**
 * Determine risk level label from a numeric score.
 */
function scoreToRiskLabel(score) {
  if (score >= 85) return 'low';
  if (score >= 65) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

module.exports = { updateRiskZone, calculateSegmentScore, scoreToRiskLabel };
