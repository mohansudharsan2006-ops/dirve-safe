import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { detectHardBrake, detectSuddenAcceleration, detectSpeedViolation, haversineDistance } from '../utils/driving';

const SPEED_LIMIT = 60;
const NEARBY_CHECK_INTERVAL = 15000; // check risk zones every 15s
const WAYPOINT_FLUSH_INTERVAL = 30000; // flush waypoints every 30s

export default function Drive() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('idle'); // idle | driving | ended
  const [tripId, setTripId] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [memoryAlerts, setMemoryAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(100);
  const [error, setError] = useState('');

  const watchIdRef = useRef(null);
  const prevPosRef = useRef(null);
  const prevSpeedRef = useRef(0);
  const waypointQueueRef = useRef([]);
  const tripIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const nearbyTimerRef = useRef(null);
  const waypointTimerRef = useRef(null);

  // Keep tripId ref in sync
  useEffect(() => { tripIdRef.current = tripId; }, [tripId]);

  // Elapsed timer
  useEffect(() => {
    if (phase === 'driving') {
      timerRef.current = setInterval(() => {
        setElapsed(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const logEvent = useCallback(async (type, severity, extraData = {}) => {
    if (!tripIdRef.current || !prevPosRef.current) return;
    const { lat, lng } = prevPosRef.current;
    try {
      const res = await api.post(`/trips/${tripIdRef.current}/events`, {
        type, severity,
        location: { lat, lng },
        speed: prevSpeedRef.current,
        ...extraData
      });
      setEvents(prev => [{ type, severity, timestamp: Date.now() }, ...prev.slice(0, 9)]);
      setScore(prev => Math.max(0, prev - (severity === 'high' ? 12 : severity === 'medium' ? 6 : 3)));
      // Surface memory zone warning if returned
      if (res.data?.riskZone?.eventCount > 1) {
        showMemoryAlert(res.data.riskZone);
      }
    } catch {}
  }, []);

  const showMemoryAlert = (zone) => {
    const alert = {
      id: Date.now(),
      message: zone.warningMessage,
      level: zone.riskLevel,
      count: zone.eventCount
    };
    setMemoryAlerts(prev => [alert, ...prev.slice(0, 2)]);
    setTimeout(() => {
      setMemoryAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 8000);
  };

  const checkNearbyZones = useCallback(async () => {
    if (!tripIdRef.current || !prevPosRef.current) return;
    const { lat, lng } = prevPosRef.current;
    try {
      const res = await api.get(`/risk-zones/nearby?lat=${lat}&lng=${lng}&radius=100`);
      if (res.data?.hasWarnings) {
        res.data.warnings.forEach(w => showMemoryAlert(w));
      }
    } catch {}
  }, []);

  const flushWaypoints = useCallback(async () => {
    if (!tripIdRef.current || waypointQueueRef.current.length === 0) return;
    const points = [...waypointQueueRef.current];
    waypointQueueRef.current = [];
    try {
      await api.post(`/trips/${tripIdRef.current}/waypoints`, { waypoints: points });
    } catch {}
  }, []);

  const handlePosition = useCallback((pos) => {
    const { latitude: lat, longitude: lng, speed: rawSpeed } = pos.coords;
    // Convert m/s to km/h
    const speedKmh = rawSpeed ? Math.round(rawSpeed * 3.6) : 0;
    setSpeed(speedKmh);

    // Distance calculation
    if (prevPosRef.current) {
      const d = haversineDistance(prevPosRef.current.lat, prevPosRef.current.lng, lat, lng);
      setDistance(prev => prev + d);

      // Event detection
      const prevSpd = prevSpeedRef.current;

      const brakeLevel = detectHardBrake(prevSpd, speedKmh);
      if (brakeLevel) {
        logEvent('hard_brake', brakeLevel);
        setWarnings(w => ['Hard brake detected!', ...w.slice(0, 3)]);
      }

      const accelLevel = detectSuddenAcceleration(prevSpd, speedKmh);
      if (accelLevel) {
        logEvent('sudden_acceleration', accelLevel);
      }

      const speedLevel = detectSpeedViolation(speedKmh, SPEED_LIMIT);
      if (speedLevel && speedLevel !== 'low') {
        logEvent('speed_violation', speedLevel);
        setWarnings(w => [`Speed: ${speedKmh} km/h over limit`, ...w.slice(0, 3)]);
      }
    }

    // Queue waypoint
    waypointQueueRef.current.push({ lat, lng, speed: speedKmh, timestamp: new Date() });
    prevPosRef.current = { lat, lng };
    prevSpeedRef.current = speedKmh;
  }, [logEvent]);

  const startDrive = async () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      try {
        const res = await api.post('/trips', {
          startLocation: { lat, lng }
        });
        setTripId(res.data.trip._id);
        prevPosRef.current = { lat, lng };
        startTimeRef.current = Date.now();
        setPhase('driving');
        setScore(100);
        setElapsed(0);
        setDistance(0);
        setEvents([]);
        setWarnings([]);

        // Start GPS watch
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePosition,
          () => {},
          { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );

        // Periodic checks
        nearbyTimerRef.current = setInterval(checkNearbyZones, NEARBY_CHECK_INTERVAL);
        waypointTimerRef.current = setInterval(flushWaypoints, WAYPOINT_FLUSH_INTERVAL);
      } catch (err) {
        setError('Could not start trip. Check your connection.');
      }
    }, () => {
      setError('Location permission denied. Enable GPS to start a drive.');
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const endDrive = async () => {
    clearInterval(nearbyTimerRef.current);
    clearInterval(waypointTimerRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    await flushWaypoints();

    try {
      await api.put(`/trips/${tripIdRef.current}/end`, {
        endLocation: prevPosRef.current,
        distanceKm: parseFloat(distance.toFixed(2)),
        avgSpeedKmh: prevSpeedRef.current,
        maxSpeedKmh: prevSpeedRef.current
      });
    } catch {}

    setPhase('ended');
  };

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const riskLabel = score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High';
  const riskColor = score >= 80 ? '#00E87A' : score >= 60 ? '#FF9500' : '#FF4444';

  return (
    <div className="flex flex-col h-full bg-brand-bg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            {phase === 'driving' && (
              <span className="inline-block w-2 h-2 rounded-full bg-brand-amber animate-pulse" />
            )}
            <h1 className="font-display text-lg sm:text-xl font-bold text-brand-text">
              {phase === 'idle' ? '🚗 Ready to Drive' : phase === 'driving' ? '🔴 Live Drive' : '✓ Trip Complete'}
            </h1>
          </div>
          {phase === 'driving' && (
            <span className="text-brand-cyan text-sm sm:text-base font-display font-bold">{formatElapsed(elapsed)}</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* IDLE state */}
          {phase === 'idle' && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="inline-flex items-center justify-center w-48 h-48 rounded-full bg-brand-cyan/10 border-2 border-brand-cyan/30 relative mt-4">
                {[56, 90, 130].map((size, i) => (
                  <div key={i} className="radar-ring" style={{ width: size, height: size, animationDelay: `${i * 0.6}s` }} />
                ))}
                <div className="absolute w-6 h-6 rounded-full bg-brand-cyan shadow-glow-cyan" />
              </div>
              
              <div className="space-y-2">
                <p className="text-brand-text text-base sm:text-lg font-semibold">Start Your Safe Drive</p>
                <p className="text-brand-text-dark text-sm leading-relaxed max-w-sm mx-auto">
                  DriveMind AI will monitor your drive in real-time, alert you to risk zones, and provide instant feedback on your driving behavior.
                </p>
              </div>

              {error && (
                <div className="bg-red-950 border border-brand-red text-brand-red text-sm rounded-xl px-4 py-3">
                  ⚠️ {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="dm-card">
                  <div className="text-2xl mb-1">📍</div>
                  <div className="text-brand-muted text-xs">GPS Enabled</div>
                </div>
                <div className="dm-card">
                  <div className="text-2xl mb-1">🚨</div>
                  <div className="text-brand-muted text-xs">Real-time Alerts</div>
                </div>
              </div>

              <button className="dm-btn-primary" onClick={startDrive}>
                Start Drive
              </button>
            </div>
          )}

          {/* DRIVING state */}
          {phase === 'driving' && (
            <div className="space-y-4 animate-slide-up">
              {/* Speed Display - Large and prominent */}
              <div className="relative w-40 h-40 mx-auto mb-6 sm:mb-8">
                {[56, 90, 130].map((size, i) => (
                  <div key={i} className="radar-ring" style={{ width: size, height: size, animationDelay: `${i * 0.6}s` }} />
                ))}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-5xl sm:text-6xl font-bold text-brand-cyan">{speed}</span>
                  <span className="text-brand-muted text-sm sm:text-base">km/h</span>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="dm-card text-center py-4">
                  <div className="font-display text-2xl font-bold mb-1" style={{ color: riskColor }}>
                    {riskLabel}
                  </div>
                  <div className="text-brand-muted text-xs font-medium">Risk Level</div>
                </div>
                <div className="dm-card text-center py-4 border-brand-cyan/30">
                  <div className="font-display text-3xl font-bold text-brand-cyan mb-1">{score}</div>
                  <div className="text-brand-muted text-xs font-medium">Safety Score</div>
                </div>
                <div className="dm-card text-center py-4">
                  <div className="font-display text-2xl font-bold text-brand-green mb-1">{distance.toFixed(1)}</div>
                  <div className="text-brand-muted text-xs font-medium">Distance</div>
                </div>
              </div>

              {/* Memory Alerts Section */}
              {memoryAlerts.length > 0 && (
                <div className="space-y-2">
                  {memoryAlerts.map(alert => (
                    <div key={alert.id} className="animate-slide-in bg-orange-950/40 border border-brand-amber rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-1 flex-shrink-0">⚠️</span>
                        <div className="flex-1">
                          <div className="font-semibold text-brand-amber text-sm">Road Memory Alert</div>
                          <p className="text-brand-amber/80 text-xs sm:text-sm leading-relaxed mt-1">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Warnings */}
              {warnings.length > 0 && (
                <div className="space-y-2">
                  {warnings.slice(0, 2).map((w, i) => (
                    <div key={i} className="animate-slide-in dm-card border-brand-red/50 bg-red-950/30 text-brand-red text-sm py-3 px-4 flex items-center gap-2">
                      <span className="flex-shrink-0">⚡</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Events Log */}
              {events.length > 0 && (
                <div className="bg-brand-surface rounded-2xl p-4 border border-brand-border">
                  <h3 className="dm-label mb-3">Event Log</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {events.slice(0, 5).map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-brand-text capitalize">{e.type.replace('_', ' ')}</span>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: e.severity === 'high' ? '#FF44441A' : e.severity === 'medium' ? '#FF95001A' : '#00E87A1A',
                            color: e.severity === 'high' ? '#FF4444' : e.severity === 'medium' ? '#FF9500' : '#00E87A'
                          }}
                        >
                          {e.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* End Drive Button */}
              <button className="dm-btn-secondary w-full mt-6 py-4" onClick={endDrive}>
                End Drive
              </button>
            </div>
          )}

          {/* ENDED state */}
          {phase === 'ended' && (
            <div className="text-center space-y-6 animate-slide-up">
              {/* Final Score */}
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4" style={{
                border: `3px solid ${riskColor}`,
                background: `${riskColor}15`
              }}>
                <div className="text-center">
                  <div className="font-display text-5xl font-bold" style={{ color: riskColor }}>{score}</div>
                  <div className="text-brand-muted text-xs mt-1">Score</div>
                </div>
              </div>

              <div>
                <p className="text-brand-text text-lg font-semibold">Trip Complete!</p>
                <p className="text-brand-text-dark text-sm mt-1">
                  {score >= 80 ? 'Great driving! You maintained excellent safety.' : score >= 60 ? 'Good effort. Keep improving!' : 'Stay focused on the road.'}
                </p>
              </div>

              {/* Trip Summary */}
              <div className="dm-card space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-brand-border/30">
                  <span className="text-brand-muted text-sm">Distance</span>
                  <span className="font-display font-bold text-brand-text">{distance.toFixed(2)} km</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-brand-border/30">
                  <span className="text-brand-muted text-sm">Duration</span>
                  <span className="font-display font-bold text-brand-text">{formatElapsed(elapsed)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-muted text-sm">Events Detected</span>
                  <span className="font-display font-bold text-brand-text">{events.length}</span>
                </div>
              </div>

              {/* Performance Badge */}
              {score >= 90 && (
                <div className="bg-green-950/30 border border-brand-green rounded-2xl p-4">
                  <p className="text-brand-green font-semibold text-sm">🏆 Excellent Performance!</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="dm-btn-primary" onClick={() => { setPhase('idle'); setScore(100); }}>
                  Start Another Drive
                </button>
                <button className="dm-btn-secondary" onClick={() => navigate('/coach')}>
                  View Insights
                </button>
                <button 
                  className="w-full py-3 text-brand-muted border border-brand-border rounded-2xl hover:bg-brand-surface transition-colors"
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
