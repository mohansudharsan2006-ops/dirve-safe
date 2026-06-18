import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../utils/api';
import { scoreToGrade } from '../utils/driving';

export default function Analytics() {
  const [trips, setTrips] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/trips/summary'),
      api.get('/analytics/dashboard')
    ]).then(([tripsRes, dashRes]) => {
      setTrips(tripsRes.data.trips || []);
      setDashboard(dashRes.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const radarData = dashboard ? [
    { metric: 'Braking', score: 85 },
    { metric: 'Speed', score: dashboard.todayScore || 88 },
    { metric: 'Lane', score: 96 },
    { metric: 'Accel', score: 80 },
    { metric: 'Focus', score: 90 },
  ] : [];

  const avgScore = trips.length > 0
    ? Math.round(trips.reduce((s, t) => s + t.safetyScore, 0) / trips.length)
    : 0;

  const scoreColor = avgScore >= 80 ? '#00E87A' : avgScore >= 60 ? '#FF9500' : '#FF4444';

  return (
    <div className="flex flex-col h-full bg-brand-bg overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-brand-border">
        <span className="font-display text-lg font-bold text-brand-text">Trip Analytics</span>
        <span className="text-brand-muted text-xs">{trips.length} trips</span>
      </div>

      <div className="px-5 pb-6">
        {loading ? (
          <div className="mt-8 text-center text-brand-muted animate-pulse">Loading analytics…</div>
        ) : trips.length === 0 ? (
          <div className="mt-16 text-center text-brand-muted">
            No trips yet. Start your first drive to see analytics.
          </div>
        ) : (
          <>
            {/* Overall score */}
            <div className="dm-card mt-4 text-center mb-4">
              <div className="font-display text-5xl font-bold mb-1" style={{ color: scoreColor }}>
                {avgScore}
              </div>
              <div className="text-brand-muted text-xs">Average safety score ({scoreToGrade(avgScore)})</div>
            </div>

            {/* Radar chart */}
            {radarData.length > 0 && (
              <div className="dm-card mb-4">
                <div className="dm-label mb-3">Skill breakdown</div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1E2535" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280', fontSize: 11 }} />
                    <Radar
                      dataKey="score"
                      stroke="#00D4FF"
                      fill="#00D4FF"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Weekly bar chart */}
            {dashboard?.chartData && (
              <div className="dm-card mb-4">
                <div className="dm-label mb-3">Week overview</div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={dashboard.chartData} barSize={16}>
                    <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #1E2535', borderRadius: 8, color: '#E8EAF0', fontSize: 12 }}
                      labelStyle={{ color: '#6B7280' }}
                    />
                    <Bar
                      dataKey="score"
                      radius={[4, 4, 0, 0]}
                      fill="#00D4FF"
                      label={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Trip list */}
            <div className="dm-label mb-3">Recent trips</div>
            <div className="flex flex-col gap-2">
              {trips.map(trip => {
                const tc = trip.safetyScore >= 80 ? '#00E87A' : trip.safetyScore >= 60 ? '#FF9500' : '#FF4444';
                const isActive = activeTrip === trip._id;
                return (
                  <div
                    key={trip._id}
                    className="dm-card cursor-pointer"
                    onClick={() => setActiveTrip(isActive ? null : trip._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-display text-2xl font-bold" style={{ color: tc }}>
                          {trip.safetyScore}
                        </div>
                        <div className="text-brand-muted text-xs mt-0.5">
                          {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' · '}{trip.distanceKm?.toFixed(1) || 0} km
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-brand-text text-sm">{scoreToGrade(trip.safetyScore)}</div>
                        <div className="text-brand-muted text-xs">{trip.avgSpeedKmh || 0} km/h avg</div>
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-3 pt-3 border-t border-brand-border grid grid-cols-3 gap-2">
                        {[
                          { label: 'Hard brakes', value: trip.hardBrakes || 0, color: '#FF4444' },
                          { label: 'Speed flags', value: trip.speedViolations || 0, color: '#FF9500' },
                          { label: 'Duration', value: `${trip.durationMinutes || 0}m`, color: '#00D4FF' }
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center">
                            <div className="font-display text-lg font-bold" style={{ color }}>{value}</div>
                            <div className="text-brand-muted text-[10px] leading-tight">{label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
