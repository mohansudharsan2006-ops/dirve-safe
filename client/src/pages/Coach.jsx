import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { Alert } from '../components/Alert';
import { SkeletonCard, SkeletonText } from '../components/Skeleton';

const ICON_MAP = {
  'alert-triangle': '⚠',
  'gauge': '⚡',
  'check': '✓',
  'brain': '🧠',
  'star': '★',
  'info': 'ℹ',
  'speed': '🏎️',
  'safety': '🛡️'
};

function InsightCard({ insight }) {
  const colors = {
    warning: { bg: '#1A0F00', border: '#FF9500', text: '#FF9500', body: '#A07040' },
    success: { bg: '#001A0D', border: '#00E87A', text: '#00E87A', body: '#3A7A55' },
    info: { bg: '#00111A', border: '#00D4FF', text: '#00D4FF', body: '#2A6A80' }
  };
  const c = colors[insight.type] || colors.info;

  return (
    <Alert 
      variant={insight.type === 'warning' ? 'warning' : insight.type === 'success' ? 'success' : 'info'}
      icon={ICON_MAP[insight.icon] || 'ℹ'}
      title={insight.title}
    >
      {insight.message}
    </Alert>
  );
}

function RatingBadge({ rating }) {
  const colors = {
    'A+': '#00E87A',
    'A': '#00E87A',
    'B+': '#00D4FF',
    'B': '#00D4FF',
    'C': '#FF9500',
    'D': '#FF4444',
    'F': '#FF4444'
  };

  const color = colors[rating] || '#00D4FF';

  return (
    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2" style={{ borderColor: color, color }}>
      <span className="font-display text-5xl font-bold">{rating}</span>
    </div>
  );
}

export default function Coach() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/coach')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full bg-brand-bg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-brand-text">🧠 AI Driving Coach</h1>
            {data && (
              <p className="text-brand-muted text-xs sm:text-sm mt-1">
                {data.totalTripsAnalyzed || 0} trips analyzed
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-6">
              <div className="text-center">
                <SkeletonCard className="h-32 w-32 mx-auto rounded-full" />
              </div>
              <SkeletonText lines={6} />
            </div>
          ) : !data ? (
            <Alert variant="warning" icon="⚠" title="No Data Available">
              Could not load coach data. Try again later.
            </Alert>
          ) : (
            <>
              {/* Rating Section */}
              <div className="text-center mb-8 animate-slide-up">
                <p className="dm-label mb-4">Your Safety Rating</p>
                <div className="flex justify-center mb-4">
                  <RatingBadge rating={data.safetyRating} />
                </div>
                {data.overallScore > 0 && (
                  <div className="space-y-2">
                    <p className="text-brand-muted text-sm">Overall Performance</p>
                    <div className="relative h-3 bg-brand-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-cyan to-brand-green rounded-full transition-all duration-1000"
                        style={{ width: `${data.overallScore}%` }}
                      />
                    </div>
                    <p className="font-display text-2xl font-bold text-brand-cyan">
                      {data.overallScore}/100
                    </p>
                  </div>
                )}
              </div>

              {/* Key Metrics */}
              {data.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {Object.entries(data.metrics).map(([key, value]) => (
                    <Card key={key} className="text-center">
                      <div className="text-2xl font-bold text-brand-cyan mb-1">{value}</div>
                      <div className="text-xs text-brand-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Insights Section */}
              <div className="mb-8">
                <h2 className="dm-label mb-4">Personalized Insights</h2>
                <div className="space-y-3">
                  {data.insights && data.insights.length > 0 ? (
                    data.insights.map((insight, i) => (
                      <InsightCard key={i} insight={insight} />
                    ))
                  ) : (
                    <Alert variant="success" icon="✓">
                      Keep up your excellent driving! No areas of concern detected.
                    </Alert>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div className="mb-8">
                  <h2 className="dm-label mb-4">Recommendations</h2>
                  <div className="space-y-3">
                    {data.recommendations.map((rec, i) => (
                      <Card key={i} className="bg-brand-surface-light">
                        <CardTitle className="text-sm sm:text-base">{rec.title}</CardTitle>
                        <CardContent className="mt-2">
                          <p className="text-xs sm:text-sm text-brand-text-dark leading-relaxed">
                            {rec.description}
                          </p>
                          {rec.action && (
                            <Badge variant="info" className="mt-3">
                              → {rec.action}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Tracking */}
              {data.progressTrend && (
                <div className="mb-8">
                  <h2 className="dm-label mb-4">Progress This Month</h2>
                  <Card className="bg-gradient-to-br from-brand-green/10 to-brand-cyan/10 border-brand-green/30">
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-brand-text">Score Trend</span>
                          <Badge variant="success">{data.progressTrend}%</Badge>
                        </div>
                        <div className="h-8 bg-brand-surface rounded-lg flex items-center px-2">
                          <div className="text-xs font-semibold">
                            📈 {data.progressTrend > 0 ? 'Improving' : data.progressTrend < 0 ? 'Declining' : 'Stable'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tips Section */}
              <Card className="bg-brand-cyan/5 border-brand-cyan/30 mb-6">
                <CardTitle className="text-sm sm:text-base">💡 Pro Tips</CardTitle>
                <CardContent className="mt-3 space-y-2 text-xs sm:text-sm text-brand-text-dark">
                  <p>• Maintain consistent speeds on highways for better fuel efficiency</p>
                  <p>• Take breaks every 2 hours on long drives</p>
                  <p>• Check your blind spots before lane changes</p>
                  <p>• Keep a safe following distance in traffic</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
