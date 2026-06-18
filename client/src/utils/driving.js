/**
 * Calculate distance between two GPS points using Haversine formula.
 * Returns distance in kilometers.
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Detect hard braking: speed drop > 20 km/h in one second.
 */
export function detectHardBrake(prevSpeed, currentSpeed, deltaSeconds = 1) {
  const decel = (prevSpeed - currentSpeed) / deltaSeconds;
  if (decel >= 30) return 'high';
  if (decel >= 20) return 'medium';
  if (decel >= 12) return 'low';
  return null;
}

/**
 * Detect sudden acceleration: speed gain > 20 km/h in one second.
 */
export function detectSuddenAcceleration(prevSpeed, currentSpeed, deltaSeconds = 1) {
  const accel = (currentSpeed - prevSpeed) / deltaSeconds;
  if (accel >= 30) return 'high';
  if (accel >= 20) return 'medium';
  if (accel >= 12) return 'low';
  return null;
}

/**
 * Detect speed violation given a speed limit.
 */
export function detectSpeedViolation(speed, limit = 60) {
  const excess = speed - limit;
  if (excess >= 30) return 'high';
  if (excess >= 15) return 'medium';
  if (excess >= 5) return 'low';
  return null;
}

/**
 * Get a human-friendly address description for a GPS coordinate.
 * Uses Nominatim (OpenStreetMap) reverse geocoding — free, no API key needed.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address;
    return addr.road || addr.suburb || addr.neighbourhood || addr.town || addr.city || 'Unknown location';
  } catch {
    return 'Unknown location';
  }
}

/**
 * Format seconds into MM:SS string.
 */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

/**
 * Convert a safety score (0-100) to a letter grade.
 */
export function scoreToGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 88) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

/**
 * Get Tailwind-compatible color class for a risk level.
 */
export function riskColor(level) {
  const map = {
    low: '#00E87A',
    medium: '#FF9500',
    high: '#FF4444',
    critical: '#FF4444'
  };
  return map[level] || '#6B7280';
}
