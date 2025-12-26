import { useEffect, useRef } from 'react';
import L from 'leaflet';
import polyline from 'polyline-encoded';
import 'leaflet/dist/leaflet.css';
import type { Activity } from '../../types/activity';
import { useThemeStore } from '../../stores/themeStore';

interface ActivityMapProps {
  activities: Activity[];
  height?: string;
}

const ACTIVITY_COLORS: Record<string, string> = {
  Run: '#FC4C02', // Strava orange
  Ride: '#0066CC', // Blue
  Swim: '#00D4AA', // Teal
  Walk: '#666666', // Gray
  Hike: '#8B4513', // Brown
  default: '#999999',
};

// Create custom marker icons for each activity type
const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

export const ActivityMap = ({ activities, height = '600px' }: ActivityMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);
  const isDark = getEffectiveTheme() === 'dark';

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.remove();

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = isDark
      ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
      : '© OpenStreetMap contributors';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 18,
    }).addTo(mapRef.current);
  }, [isDark]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Only initialize map once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [51.505, -0.09], // Default center
        zoom: 3,
        zoomControl: true,
      });

      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const attribution = isDark
        ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
        : '© OpenStreetMap contributors';

      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 18,
      }).addTo(mapRef.current);

      layersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing layers
    if (layersRef.current) {
      layersRef.current.clearLayers();
    } else {
      layersRef.current = L.layerGroup().addTo(map);
    }

    const bounds = L.latLngBounds([]);
    let validActivityCount = 0;

    activities.forEach((activity) => {
      // Skip virtual activities
      if (activity.type.toLowerCase().includes('virtual')) return;

      if (!activity.polyline) return;

      try {
        // Decode the polyline
        const coordinates = polyline.decode(activity.polyline);
        if (coordinates.length === 0) return;

        // Convert to Leaflet LatLng format
        const latlngs = coordinates.map(([lat, lng]) => L.latLng(lat, lng));

        // Get color based on activity type
        const color = ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.default;

        // Add polyline route to map
        const polylineLayer = L.polyline(latlngs, {
          color: color,
          weight: 2,
          opacity: 0.4,
        }).addTo(layersRef.current!);

        // Add basic popup to route
        polylineLayer.bindPopup(`
          <div>
            <strong>${activity.name}</strong><br/>
            <span style="color: ${color}">■</span> ${activity.type}<br/>
            ${activity.distanceKm.toFixed(2)} km
          </div>
        `);

        // Get start point (first coordinate)
        const [startLat, startLng] = coordinates[0];
        const startLatLng = L.latLng(startLat, startLng);

        // Create clickable marker at start point
        const icon = createMarkerIcon(color);
        const marker = L.marker(startLatLng, { icon }).addTo(layersRef.current!);

        // Create popup with link to Strava
        const popupContent = `
          <div class="text-sm">
            <a href="https://www.strava.com/activities/${activity.id}" target="_blank" rel="noopener noreferrer" style="color: #FC4C02; text-decoration: none; font-weight: 600; font-size: 14px;">
              ${activity.name}
            </a><br/>
            <span style="color: ${color}">■</span> ${activity.type}<br/>
            ${activity.distanceKm.toFixed(2)} km · ${activity.date.toLocaleDateString()}<br/>
            <a href="https://www.strava.com/activities/${activity.id}" target="_blank" rel="noopener noreferrer" style="color: #FC4C02; text-decoration: none; font-size: 12px; margin-top: 4px; display: inline-block;">
              View on Strava →
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Make marker clickable - open Strava directly
        marker.on('click', () => {
          window.open(`https://www.strava.com/activities/${activity.id}`, '_blank');
        });

        // Extend bounds
        latlngs.forEach((latlng) => bounds.extend(latlng));
        validActivityCount++;
      } catch (error) {
        console.warn(`Failed to decode polyline for activity ${activity.id}:`, error);
      }
    });

    // Fit map to show all activities
    if (validActivityCount > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      // Don't destroy the map, just clean up layers
    };
  }, [activities]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const activitiesWithMaps = activities.filter(
    (a) => a.polyline && !a.type.toLowerCase().includes('virtual')
  ).length;
  const totalActivities = activities.length;

  // Count activities by type (excluding virtual)
  const typeCounts = new Map<string, number>();
  activities.forEach((a) => {
    if (a.polyline && !a.type.toLowerCase().includes('virtual')) {
      typeCounts.set(a.type, (typeCounts.get(a.type) || 0) + 1);
    }
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          {Array.from(typeCounts.entries()).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ACTIVITY_COLORS[type] || ACTIVITY_COLORS.default }}
              ></span>
              <span className="text-gray-600 dark:text-gray-400">
                {type} ({count})
              </span>
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {activitiesWithMaps} of {totalActivities} activities
        </div>
      </div>
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%', zIndex: 0 }}
        className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
      />
    </div>
  );
};
