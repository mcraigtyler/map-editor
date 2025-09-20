import maplibregl, { LngLatLike, Map, NavigationControl, StyleSpecification } from 'maplibre-gl';
import { useEffect, useRef } from 'react';

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    openmaptiles: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-basemap',
      type: 'raster',
      source: 'openmaptiles',
    },
  ],
};

const ATTRIBUTION_OPTIONS = {
  compact: false,
} as const;

const INITIAL_CENTER: LngLatLike = [-98.5795, 39.8283];
const INITIAL_ZOOM = 3;

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl(ATTRIBUTION_OPTIONS));

    mapRef.current = map;

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  return <div ref={containerRef} className="map-view" aria-label="MapLibre map" role="presentation" />;
}
