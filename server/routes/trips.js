const express = require('express');
const { body, validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const RiskZone = require('../models/RiskZone');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateRiskZone } = require('../utils/riskEngine');

const router = express.Router();
router.use(protect);

// GET /api/trips — list all trips for user
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20, page = 1, status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-waypoints'); // exclude large waypoints array in list view

    const total = await Trip.countDocuments(filter);

    res.json({
      trips,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/trips — start a new trip
router.post('/', [
  body('startLocation.lat').isFloat({ min: -90, max: 90 }),
  body('startLocation.lng').isFloat({ min: -180, max: 180 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Cancel any currently active trip
    await Trip.updateMany(
      { user: req.user._id, status: 'active' },
      { status: 'cancelled' }
    );

    const trip = await Trip.create({
      user: req.user._id,
      startLocation: req.body.startLocation,
      status: 'active'
    });

    res.status(201).json({ message: 'Trip started', trip });
  } catch (err) {
    next(err);
  }
});

// GET /api/trips/:id — single trip detail
router.get('/:id', async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    res.json({ trip });
  } catch (err) {
    next(err);
  }
});

// PUT /api/trips/:id/end — end an active trip
router.put('/:id/end', async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    if (trip.status !== 'active') {
      return res.status(400).json({ error: 'Trip is not active.' });
    }

    const { endLocation, distanceKm, avgSpeedKmh, maxSpeedKmh } = req.body;

    trip.status = 'completed';
    trip.endTime = new Date();
    trip.endLocation = endLocation || trip.startLocation;
    trip.distanceKm = distanceKm || 0;
    trip.avgSpeedKmh = avgSpeedKmh || 0;
    trip.maxSpeedKmh = maxSpeedKmh || 0;
    trip.durationMinutes = Math.round((trip.endTime - trip.startTime) / 60000);

    await trip.save();

    // Update user totals
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalTrips: 1,
        totalDistance: distanceKm || 0
      }
    });

    res.json({ message: 'Trip ended', trip });
  } catch (err) {
    next(err);
  }
});

// POST /api/trips/:id/events — log a risk event (called during live drive)
router.post('/:id/events', [
  body('type').isIn(['hard_brake', 'sudden_acceleration', 'sharp_turn', 'speed_violation', 'distraction']),
  body('location.lat').isFloat({ min: -90, max: 90 }),
  body('location.lng').isFloat({ min: -180, max: 180 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id, status: 'active' });
    if (!trip) return res.status(404).json({ error: 'Active trip not found.' });

    const event = {
      type: req.body.type,
      severity: req.body.severity || 'medium',
      location: req.body.location,
      speed: req.body.speed,
      description: req.body.description,
      timestamp: new Date()
    };

    trip.riskEvents.push(event);
    await trip.save();

    // Update or create risk zone in memory engine
    const riskZone = await updateRiskZone({
      userId: req.user._id,
      location: req.body.location,
      eventType: req.body.type,
      severity: req.body.severity || 'medium',
      tripId: trip._id
    });

    res.status(201).json({
      message: 'Risk event logged',
      event,
      riskZone: riskZone ? {
        id: riskZone._id,
        eventCount: riskZone.eventCount,
        riskLevel: riskZone.riskLevel,
        warningMessage: riskZone.warningMessage
      } : null
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/trips/:id/waypoints — append GPS waypoints (bulk)
router.post('/:id/waypoints', async (req, res, next) => {
  try {
    const { waypoints } = req.body;
    if (!Array.isArray(waypoints) || waypoints.length === 0) {
      return res.status(400).json({ error: 'Waypoints array required.' });
    }

    await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'active' },
      { $push: { waypoints: { $each: waypoints } } }
    );

    res.json({ message: `${waypoints.length} waypoints saved.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
