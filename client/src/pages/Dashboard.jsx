import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Card, CardContent, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { SkeletonCard, SkeletonText } from '../components/Skeleton';

function ScoreRing({ score, loading = false }) {
  if (loading) {
    return <div className="w-36 h-36 mx-auto mb-5 rounded-full dm-skeleton" />;
  }

  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - score / 100);
  const color = score >= 80 ? '#00E87A' : score >= 60 ? '#FF9500' : '#FF4444';

  return (
    <div className="relative w-36 h-36 mx-auto mb-5">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r="52" fill="none" stroke="#1E2535" strokeWidth="10" />
        <circle
          cx="72" cy="72" r="52"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-circle transition-all"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-brand-muted text-xs mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function StatCard({ value, label, color, loading = false }) {
  if (loading) {
    return <SkeletonCard className="h-20" />;
  }

  return (
    <Card className="h-full">
      <div
        className="font-display text-2xl sm:text-3xl font-bold leading-none"
        style={{ color: color || '#E8EAF0' }}
      >
        {value}
      </div>
      <div className="text-brand-muted text-xs mt-2 leading-tight">{label}</div>
    </Card>
  );
}

function WeeklyChart({ data, loading = false }) {
  if (loading) return <SkeletonText lines={2} className="mb-4" />;
  if (!data) return null;

  return (
    <div className="mt-6">
      <h3 className="dm-label mb-4">Weekly Performance</h3>
      <div className="flex items-end gap-1.5 h-24">
        {data.map(({ date, score }) => (
          <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
              style={{
                height: score ? `${(score / 100) * 80}px` : '4px',
                background: score
                  ? (score >= 80 ? '#00E87A' : score >= 60 ? '#FF9500' : '#FF4444')
                  : '#1E2535',
                minHeight: '4px'
              }}
              title={`${date}: ${score}%`}
            />
            <span className="text-brand-muted text-[9px] font-medium">{date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon';
  const firstName = user?.name?.split(' ')[0] || 'Driver';

  const statCards = stats ? [
    { value: stats.tripsThisWeek || 0, label: 'Trips this week', color: '#00D4FF' },
    { value: stats.riskZonesLearned || 0, label: 'Risk zones learned', color: '#00E87A' },
    { value: stats.nearMissesAvoided || 0, label: 'Near misses avoided', color: '#FF9500' },
    { value: stats.safetyRating || user?.safetyRating || 'B', label: 'Safety rating', color: '#00D4FF' }
  ] : [];

  return (
    <div className="flex flex-col h-full bg-brand-bg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-brand-cyan">{greeting},</h1>
            <p className="text-brand-muted text-xs sm:text-sm">{firstName} • Ready to drive safely?</p>
          </div>
          <button
            onClick={logout}
            className="hidden sm:block dm-btn-sm bg-brand-surface text-brand-muted hover:text-brand-cyan hover:bg-brand-surface-light"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Safety Score Section */}
          <div className="mb-8">
            <div className="mb-4">
              <p className="dm-label">Today's Safety Score</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 flex justify-center lg:justify-start">
                <ScoreRing score={stats?.todayScore ?? 100} loading={loading} />
              </div>
              <div className="lg:col-span-2">
                {loading ? (
                  <SkeletonText lines={4} />
                ) : (
                  <div className="space-y-4">
                    {stats?.scoreBreakdown && Object.entries(stats.scoreBreakdown).map(([category, value]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-brand-text capitalize">{category}</span>
                        <div className="flex-1 mx-3 h-2 bg-brand-surface rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-cyan to-brand-green"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-brand-cyan">{value}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mb-8">
            <p className="dm-label mb-4">Your Statistics</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                statCards.map(({ value, label, color }) => (
                  <StatCard key={label} value={value} label={label} color={color} />
                ))
              )}
            </div>
          </div>

          {/* Weekly Chart */}
          <WeeklyChart data={stats?.chartData} loading={loading} />

          {/* CTA Section */}
          <div className="mt-8 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="primary" 
              size="full"
              onClick={() => navigate('/drive')}
              className="sm:col-span-1"
            >
              🚗 Start Drive
            </Button>
            <Button 
              variant="secondary" 
              size="full"
              onClick={() => navigate('/coach')}
              className="sm:col-span-1"
            >
              🧠 View Insights
            </Button>
          </div>

          {/* Quick Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-brand-cyan/10 to-brand-cyan/5 border-brand-cyan/30">
                <CardTitle>🎯 Today's Goals</CardTitle>
                <CardContent className="mt-3">
                  <p className="text-sm text-brand-text-dark">
                    Drive safely, avoid risk zones, and maintain focus on the road.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Badge variant="success">Active</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-brand-green/10 to-brand-green/5 border-brand-green/30">
                <CardTitle>🏆 Achievements</CardTitle>
                <CardContent className="mt-3">
                  <p className="text-sm text-brand-text-dark">
                    {stats.achievements?.length || 0} achievements unlocked this month
                  </p>
                  {stats.achievements?.slice(0, 2).map(badge => (
                    <Badge key={badge} variant="success" className="mt-2 inline-block mr-2">
                      {badge}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
