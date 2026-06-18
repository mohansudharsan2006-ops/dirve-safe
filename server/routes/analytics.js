const express = require('express');
const Trip = require('../models/Trip');
const RiskZone = require('../models/RiskZone');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/analytics/dashboard — main dashboard stats
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    // This week's trips
    const weeklyTrips = await Trip.find({
      user: userId,
      status: 'completed',
      createdAt: { $gte: weekStart }
    });

    // Today's trips
    const todayTrips = await Trip.find({
      user: userId,
      status: 'completed',
      createdAt: { $gte: todayStart }
    });

    // Average safety score this week
    const avgSafetyScore = weeklyTrips.length > 0
      ? Math.round(weeklyTrips.reduce((sum, t) => sum + t.safetyScore, 0) / weeklyTrips.length)
      : 100;

    // Total risk zones learned
    const riskZoneCount = await RiskZone.countDocuments({ user: userId });

    // Near misses avoided (high-risk zones * 0.4 estimate)
    const highRiskZones = await RiskZone.countDocuments({ user: userId, riskLevel: { $in: ['high', 'critical'] } });
    const nearMissesAvoided = Math.round(highRiskZones * 0.4 * weeklyTrips.length / Math.max(weeklyTrips.length, 1));

    // Today's score
    const todayScore = todayTrips.length > 0
      ? Math.round(todayTrips.reduce((sum, t) => sum + t.safetyScore, 0) / todayTrips.length)
      : avgSafetyScore;

    // Weekly chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTrips = weeklyTrips.filter(t =>
        t.createdAt >= dayStart && t.createdAt <= dayEnd
      );
      const dayScore = dayTrips.length > 0
        ? Math.round(dayTrips.reduce((s, t) => s + t.safetyScore, 0) / dayTrips.length)
        : null;

      chartData.push({
        date: dayStart.toLocaleDateString('en-IN', { weekday: 'short' }),
        score: dayScore,
        trips: dayTrips.length
      });
    }

    res.json({
      todayScore,
      avgSafetyScore,
      tripsThisWeek: weeklyTrips.length,
      riskZonesLearned: riskZoneCount,
      nearMissesAvoided,
      totalDistance: req.user.totalDistance,
      totalTrips: req.user.totalTrips,
      safetyRating: req.user.safetyRating,
      chartData
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/coach — AI coach insights
router.get('/coach', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recentTrips = await Trip.find({ user: userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(20);

    const insights = [];

    if (recentTrips.length === 0) {
      return res.json({
        safetyRating: req.user.safetyRating,
        insights: [{
          type: 'info',
          icon: 'info',
          message: 'Complete your first trip to get personalized coaching insights.'
        }],
        overallScore: 100,
        recommendations: []
      });
    }

    // Analyze hard braking patterns
    const totalHardBrakes = recentTrips.reduce((s, t) => s + t.hardBrakes, 0);
    const avgHardBrakesPerTrip = totalHardBrakes / recentTrips.length;

    if (avgHardBrakesPerTrip > 2) {
      insights.push({
        type: 'warning',
        metric: 'braking',
        icon: 'alert-triangle',
        message: `You average ${avgHardBrakesPerTrip.toFixed(1)} hard brakes per trip. Try anticipating stops 30m earlier.`,
        score: Math.max(0, 100 - avgHardBrakesPerTrip * 8)
      });
    }

    // Speed violation patterns
    const totalSpeedViolations = recentTrips.reduce((s, t) => s + t.speedViolations, 0);
    if (totalSpeedViolations > 3) {
      insights.push({
        type: 'warning',
        metric: 'speed',
        icon: 'gauge',
        message: `Speed limit exceeded ${totalSpeedViolations} times recently. Check your speed near school zones.`,
        score: Math.max(0, 100 - totalSpeedViolations * 5)
      });
    }

    // Lane discipline (derived from sharp turns)
    const sharpTurnEvents = recentTrips.flatMap(t =>
      t.riskEvents.filter(e => e.type === 'sharp_turn')
    );

    if (sharpTurnEvents.length === 0) {
      insights.push({
        type: 'success',
        metric: 'lane',
        icon: 'check',
        message: 'Excellent lane discipline — no sharp turn violations in recent trips.',
        score: 98
      });
    }

    // Risk zone memory usage
    const riskZoneCount = await RiskZone.countDocuments({ user: userId });
    if (riskZoneCount > 0) {
      insights.push({
        type: 'info',
        metric: 'memory',
        icon: 'brain',
        message: `Your road memory has ${riskZoneCount} risk zone${riskZoneCount > 1 ? 's' : ''} recorded. Each revisit triggers a proactive alert.`,
        score: null
      });
    }

    // Good overall score
    const avgScore = Math.round(recentTrips.reduce((s, t) => s + t.safetyScore, 0) / recentTrips.length);
    if (avgScore >= 85) {
      insights.push({
        type: 'success',
        metric: 'overall',
        icon: 'star',
        message: `Strong overall safety score of ${avgScore}/100 across your last ${recentTrips.length} trips.`,
        score: avgScore
      });
    }

    // Determine safety rating
    let safetyRating = 'B';
    if (avgScore >= 95) safetyRating = 'A+';
    else if (avgScore >= 88) safetyRating = 'A';
    else if (avgScore >= 80) safetyRating = 'B+';
    else if (avgScore >= 70) safetyRating = 'B';
    else if (avgScore >= 60) safetyRating = 'C';
    else safetyRating = 'D';

    // Update user's safety rating
    await require('../models/User').findByIdAndUpdate(userId, { safetyRating });

    res.json({
      safetyRating,
      overallScore: avgScore,
      totalTripsAnalyzed: recentTrips.length,
      insights: insights.length > 0 ? insights : [{
        type: 'success',
        icon: 'check',
        message: 'Great driving! No significant issues detected in recent trips.'
      }],
      recommendations: [
        avgHardBrakesPerTrip > 1 ? 'Maintain 3-second following distance to reduce hard braking' : null,
        totalSpeedViolations > 0 ? 'Use cruise control on highways to stay within speed limits' : null,
        'Review your Road Memory Map before long trips'
      ].filter(Boolean)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/trips/summary — recent trips list with scores
router.get('/trips/summary', async (req, res, next) => {
  try {
    const trips = await Trip.find({ user: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('safetyScore distanceKm avgSpeedKmh durationMinutes hardBrakes speedViolations createdAt startLocation endLocation');

    res.json({ trips });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
