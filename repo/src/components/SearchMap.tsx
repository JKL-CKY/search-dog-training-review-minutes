import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import type { SearchPathPoint, ScentHotspot } from '../types';
import { HeatmapLayer } from './HeatmapLayer';

interface SearchMapProps {
  center: [number, number];
  zoom?: number;
  searchPath?: SearchPathPoint[];
  scentHotspots?: ScentHotspot[];
  height?: string;
}

export default function SearchMap({
  center,
  zoom = 15,
  searchPath = [],
  scentHotspots = [],
  height = '400px',
}: SearchMapProps) {
  const pathPoints: [number, number][] = searchPath.map((p) => [p.lat, p.lng]);

  const getHotspotColor = (intensity: number) => {
    if (intensity >= 0.8) return '#dc2626';
    if (intensity >= 0.5) return '#f59e0b';
    return '#22c55e';
  };

  const getHotspotRadius = (intensity: number, baseRadius: number) => {
    return baseRadius * (0.5 + intensity * 0.5);
  };

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {searchPath.length > 1 && (
          <Polyline
            positions={pathPoints}
            pathOptions={{
              color: '#2563eb',
              weight: 3,
              opacity: 0.8,
              dashArray: '10, 10',
            }}
          >
            <Popup>搜索路径</Popup>
          </Polyline>
        )}

        {searchPath.map((point, index) => (
          <CircleMarker
            key={`path-${index}`}
            center={[point.lat, point.lng]}
            radius={4}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#2563eb',
              fillOpacity: 0.8,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              路径点 #{index + 1}
              {point.timestamp && <br />}
              {point.timestamp}
            </Tooltip>
          </CircleMarker>
        ))}

        {scentHotspots.length > 0 && (
          <HeatmapLayer
            points={scentHotspots.map((h) => ({
              lat: h.lat,
              lng: h.lng,
              intensity: h.intensity,
            }))}
          />
        )}

        {scentHotspots.map((hotspot) => (
          <CircleMarker
            key={hotspot.id}
            center={[hotspot.lat, hotspot.lng]}
            radius={getHotspotRadius(hotspot.intensity, hotspot.radius)}
            pathOptions={{
              color: getHotspotColor(hotspot.intensity),
              fillColor: getHotspotColor(hotspot.intensity),
              fillOpacity: 0.4,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{hotspot.type}</p>
                <p>强度: {(hotspot.intensity * 100).toFixed(0)}%</p>
                <p>半径: {hotspot.radius}m</p>
                {hotspot.notes && <p className="text-gray-500">{hotspot.notes}</p>}
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              {hotspot.type} ({(hotspot.intensity * 100).toFixed(0)}%)
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
