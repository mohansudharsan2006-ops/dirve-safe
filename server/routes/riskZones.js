const express = require('express');
const RiskZone = require('../models/RiskZone');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/risk-zones — get all risk zones for user (map view)
router.get('/', async (req, res, next) => {
  try {
    const zones = await RiskZone.find({ user: req.user._id })
      .sort({ eventCount: -1 })
      .limit(100);
    res.json({ zones });
  } catch (err) {
    next(err);
  }
});

// GET /api/risk-zones/nearby?lat=&lng=&radius= — AI Memory Engine core
// Called during live drive to check if current location matches any remembered risk zones
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius = 100 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng query params required.' });
    }

    const zones = await RiskZone.find({
      user: req.user._id,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    }).limit(5);

    const warnings = zones.map(z => ({
      id: z._id,
      zoneType: z.zoneType,
      riskLevel: z.riskLevel,
      eventCount: z.eventCount,
      warningMessage: z.warningMessage,
      distance: null // could add haversine calc here
    }));

    res.json({
      hasWarnings: warnings.length > 0,
      warnings,
      count: warnings.length
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/risk-zones/:id — remove a zone
router.delete('/:id', async (req, res, next) => {
  try {
    const zone = await RiskZone.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!zone) return res.status(404).json({ error: 'Risk zone not found.' });
    res.json({ message: 'Risk zone removed.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
