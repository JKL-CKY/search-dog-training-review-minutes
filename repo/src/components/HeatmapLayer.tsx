import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  radius?: number;
  blur?: number;
}

export function HeatmapLayer({ points, radius = 30, blur = 15 }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const latRange = northEast.lat - southWest.lat;
    const lngRange = northEast.lng - southWest.lng;

    points.forEach((point) => {
      const x = ((point.lng - southWest.lng) / lngRange) * size.x;
      const y = ((northEast.lat - point.lat) / latRange) * size.y;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const alpha = point.intensity * 0.6;
      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
      gradient.addColorStop(0.3, `rgba(255, 165, 0, ${alpha * 0.7})`);
      gradient.addColorStop(0.6, `rgba(255, 255, 0, ${alpha * 0.4})`);
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });

    const imageUrl = canvas.toDataURL();
    const imageBounds = L.latLngBounds(
      [southWest.lat, southWest.lng],
      [northEast.lat, northEast.lng]
    );

    const imageOverlay = L.imageOverlay(imageUrl, imageBounds, {
      opacity: 0.5,
      interactive: false,
    }).addTo(map);

    return () => {
      map.removeLayer(imageOverlay);
    };
  }, [map, points, radius, blur]);

  return null;
}
