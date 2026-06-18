import { useState, useEffect } from 'react';
import api from '../utils/api';
import { riskColor } from '../utils/driving';

// Dynamic Leaflet import to avoid SSR issues
let L = null;
let MapContainer = null;
let TileLayer = null;
let CircleMarker = null;
let Popup = null;

export default function MemoryMap() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [center, setCenter] = useState([12.9716, 77.5946]); // Bangalore default
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Load Leaflet dynamically
    import('leaflet').then(leaflet => {
      L = leaflet.default;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: null,
        iconUrl: null,
        shadowUrl: null,
      });
    });
    import('react-leaflet').then(rl => {
      MapContainer = rl.MapContainer;
      TileLayer = rl.TileLayer;
      CircleMarker = rl.CircleMarker;
      Popup = rl.Popup;
      setMapReady(true);
    });
  }, []);

  useEffect(() => {
    api.get('/risk-zones')
      .then(res => {
        setZones(res.data.zones || []);
        if (res.data.zones?.length > 0) {
          const z = res.data.zones[0];
          setCenter([z.location.coordinates[1], z.location.coordinates[0]]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Try to get user location for map center
    navigator.geolocation?.getCurrentPosition(pos => {
      setCenter([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  const deleteZone = async (id) => {
    try {
      await api.delete(`/risk-zones/${id}`);
      setZones(prev => prev.filter(z => z._id !== id));
      setSelected(null);
    } catch {}
  };

  const riskCounts = {
    critical: zones.filter(z => z.riskLevel === 'critical').length,
    high: zones.filter(z => z.riskLevel === 'high').length,
    medium: zones.filter(z => z.riskLevel === 'medium').length,
    low: zones.filter(z => z.riskLevel === 'low').length,
  };

  return (
    <div className="flex flex-col h-full bg-brand-bg overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-brand-border">
        <span className="font-display text-lg font-bold text-brand-text">My Road Memory</span>
        <span className="text-brand-muted text-xs">{zones.length} zones</span>
      </div>

      <div className="px-5 pb-6">
        {/* Map */}
        <div className="mt-4 mb-4 rounded-2xl overflow-hidden border border-brand-border" style={{ height: 240 }}>
          {!mapReady || loading ? (
            <div className="h-full bg-brand-surface flex items-center justify-center">
              <span className="text-brand-muted text-sm animate-pulse">Loading map…</span>
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {zones.map(zone => {
                const [lng, lat] = zone.location.coordinates;
                const color = riskColor(zone.riskLevel);
                return (
                  <CircleMarker
                    key={zone._id}
                    center={[lat, lng]}
                    radius={zone.riskLevel === 'critical' ? 14 : zone.riskLevel === 'high' ? 11 : 9}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.6,
                      weight: 2
                    }}
                    eventHandlers={{ click: () => setSelected(zone) }}
                  >
                    <Popup>
                      <div style={{ color: '#0A0E1A', fontFamily: 'Inter', fontSize: 12 }}>
                        <strong>{zone.zoneType.replace('_', ' ')}</strong><br />
                        {zone.eventCount} events · {zone.riskLevel} risk
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {[
            { label: 'Hard brake', color: '#FF4444' },
            { label: 'Speed zone', color: '#FF9500' },
            { label: 'Safe route', color: '#00E87A' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <span className="text-brand-muted text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* Risk summary */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(riskCounts).filter(([, v]) => v > 0).map(([level, count]) => (
            <div key={level} className="dm-card py-2 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: riskColor(level) }} />
              <div>
                <div className="font-display text-base font-bold text-brand-text">{count}</div>
                <div className="text-brand-muted text-[10px] capitalize">{level} risk zones</div>
              </div>
            </div>
          ))}
        </div>

        {/* Zone list */}
        {zones.length === 0 ? (
          <div className="text-center py-10 text-brand-muted text-sm">
            No risk zones recorded yet.<br />
            Start a drive and DriveMind will learn your road.
          </div>
        ) : (
          <>
            <div className="dm-label mb-3">Remembered zones</div>
            <div className="flex flex-col gap-2">
              {zones.map(zone => (
                <div
                  key={zone._id}
                  className="dm-card"
                  onClick={() => setSelected(selected?._id === zone._id ? null : zone)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: riskColor(zone.riskLevel) }} />
                      <span className="text-brand-text text-sm font-medium capitalize">
                        {zone.zoneType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: riskColor(zone.riskLevel) + '22',
                        color: riskColor(zone.riskLevel),
                        border: `1px solid ${riskColor(zone.riskLevel)}`
                      }}
                    >
                      {zone.riskLevel}
                    </span>
                  </div>
                  <p className="text-brand-muted text-xs mt-1.5 leading-relaxed">{zone.warningMessage}</p>

                  {selected?._id === zone._id && (
                    <div className="mt-3 pt-3 border-t border-brand-border flex items-center justify-between">
                      <span className="text-brand-muted text-xs">{zone.eventCount} event{zone.eventCount > 1 ? 's' : ''} recorded</span>
                      <button
                        onClick={e => { e.stopPropagation(); deleteZone(zone._id); }}
                        className="text-brand-red text-xs border border-brand-red rounded-lg px-3 py-1 hover:bg-red-950 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
