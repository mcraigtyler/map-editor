import maplibregl, {
  GeoJSONSource,
  LegacyFilterSpecification,
  LngLatLike,
  Map,
  NavigationControl,
  StyleSpecification,
} from 'maplibre-gl';
import MapboxDraw from 'maplibre-gl-draw';
import type {
  DrawCreateEvent,
  DrawMode,
  DrawModeChangeEvent,
  DrawSelectionChangeEvent,
  DrawUpdateEvent,
} from '@mapbox/mapbox-gl-draw';
import type {
  Feature as GeoJsonFeature,
  FeatureCollection as GeoJsonFeatureCollection,
  Geometry as GeoJsonGeometry,
} from 'geojson';
import { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { ApiError } from '~/lib/apiClient';
import { useCreateFeatureMutation, useFeatureList } from '~/features/feature/hooks';
import type { FeatureCollection, FeatureProperties } from '~/features/feature/types';
import { useDrawingStore } from '~/features/drawing/state';
import type { DrawingIntent } from '~/features/drawing/state';
import { fromGeoJsonGeometry, toGeoJsonGeometry } from '~/features/drawing/utils';

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

const FEATURE_SOURCE_ID = 'features';
const FEATURE_FILL_LAYER_ID = 'features-fill';
const FEATURE_LINE_LAYER_ID = 'features-line';
const FEATURE_POINT_LAYER_ID = 'features-point';
const SELECTED_FILL_LAYER_ID = 'selected-feature-fill';
const SELECTED_LINE_LAYER_ID = 'selected-feature-line';
const SELECTED_POINT_LAYER_ID = 'selected-feature-point';

const BASE_POINT_COLOR = '#2563eb';
const BASE_LINE_COLOR = '#2563eb';
const BASE_FILL_COLOR = '#38bdf8';
const HIGHLIGHT_COLOR = '#f97316';

const BASE_LINE_FILTER: LegacyFilterSpecification = ['in', '$type', 'LineString', 'Polygon'];
const BASE_FILL_FILTER: LegacyFilterSpecification = ['==', '$type', 'Polygon'];
const BASE_POINT_FILTER: LegacyFilterSpecification = ['==', '$type', 'Point'];

const EMPTY_GEOJSON: MapFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

type MapFeature = GeoJsonFeature<GeoJsonGeometry, FeatureProperties>;
type MapFeatureCollection = GeoJsonFeatureCollection<GeoJsonGeometry, FeatureProperties>;
type DrawFeature = GeoJsonFeature<GeoJsonGeometry, Record<string, unknown>>;

function getDrawModeForIntent(intent: DrawingIntent): DrawMode {
  switch (intent) {
    case 'point':
      return 'draw_point';
    case 'line':
      return 'draw_line_string';
    case 'polygon':
      return 'draw_polygon';
    default:
      return 'draw_point';
  }
}

function changeDrawMode(draw: MapboxDraw, mode: DrawMode, options?: object) {
  (draw as unknown as { changeMode: (mode: DrawMode, options?: object) => void }).changeMode(mode, options);
}

function toGeoJsonBbox(bbox?: number[]): GeoJsonFeatureCollection['bbox'] | undefined {
  if (!bbox) {
    return undefined;
  }

  if (bbox.length === 4 || bbox.length === 6) {
    return bbox as GeoJsonFeatureCollection['bbox'];
  }

  console.warn('Ignoring bbox with unexpected length', bbox);
  return undefined;
}

function toGeoJson(collection?: FeatureCollection): MapFeatureCollection {
  if (!collection) {
    return EMPTY_GEOJSON;
  }

  return {
    type: 'FeatureCollection',
    features: collection.features.map<MapFeature>((feature) => ({
      type: 'Feature',
      id: feature.id,
      geometry: feature.geometry as unknown as GeoJsonGeometry,
      properties: feature.properties,
    })),
    bbox: toGeoJsonBbox(collection.bbox),
  };
}

function extendBoundsWithCoordinates(bounds: maplibregl.LngLatBounds, coordinates: unknown): boolean {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return false;
  }

  const [first] = coordinates;

  if (typeof first === 'number' && typeof coordinates[1] === 'number') {
    const [lng, lat] = coordinates as [number, number];
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      bounds.extend([lng, lat]);
      return true;
    }
    return false;
  }

  let hasPoint = false;
  for (const value of coordinates) {
    if (extendBoundsWithCoordinates(bounds, value)) {
      hasPoint = true;
    }
  }
  return hasPoint;
}

function extendBoundsWithGeometry(bounds: maplibregl.LngLatBounds, geometry: GeoJsonGeometry): boolean {
  if (geometry.type === 'GeometryCollection') {
    let hasPoint = false;
    geometry.geometries.forEach((inner) => {
      if (extendBoundsWithGeometry(bounds, inner)) {
        hasPoint = true;
      }
    });
    return hasPoint;
  }

  const coordinates = (geometry as Exclude<GeoJsonGeometry, { type: 'GeometryCollection' }>).coordinates as unknown;
  return extendBoundsWithCoordinates(bounds, coordinates);
}

function getCollectionBounds(collection: MapFeatureCollection): maplibregl.LngLatBounds | null {
  const bounds = new maplibregl.LngLatBounds();
  let hasCoordinates = false;

  collection.features.forEach((feature: MapFeature) => {
    if (extendBoundsWithGeometry(bounds, feature.geometry)) {
      hasCoordinates = true;
    }
  });

  return hasCoordinates ? bounds : null;
}

function getFeatureBounds(feature: MapFeature): maplibregl.LngLatBounds | null {
  const bounds = new maplibregl.LngLatBounds();
  const hasCoordinates = extendBoundsWithGeometry(bounds, feature.geometry);
  return hasCoordinates ? bounds : null;
}

function updateHighlightFilters(map: Map, featureId: string | undefined) {
  const idFilter: LegacyFilterSpecification = featureId
    ? ['==', '$id', featureId]
    : ['==', '$id', '__none__'];

  const highlightFilters: Array<[string, LegacyFilterSpecification]> = [
    [SELECTED_FILL_LAYER_ID, ['all', BASE_FILL_FILTER, idFilter] as LegacyFilterSpecification],
    [SELECTED_LINE_LAYER_ID, ['all', BASE_LINE_FILTER, idFilter] as LegacyFilterSpecification],
    [SELECTED_POINT_LAYER_ID, ['all', BASE_POINT_FILTER, idFilter] as LegacyFilterSpecification],
  ];

  highlightFilters.forEach(([layerId, filter]) => {
    if (map.getLayer(layerId)) {
      map.setFilter(layerId, filter);
    }
  });
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const sourceReadyRef = useRef(false);
  const hasFitToAllRef = useRef(false);
  const lastSelectedRef = useRef<string | undefined>(undefined);

  const { mutate: createFeature } = useCreateFeatureMutation();
  const createFeatureMutateRef = useRef(createFeature);
  useEffect(() => {
    createFeatureMutateRef.current = createFeature;
  }, [createFeature]);

  const drawingMode = useDrawingStore((state) => state.mode);
  const drawingIntent = useDrawingStore((state) => state.intent);
  const editingFeatureId = useDrawingStore((state) => state.editing?.featureId);

  const { featureId } = useParams<{ featureId: string }>();
  const { data: collection } = useFeatureList();

  const geoJsonData = useMemo(() => toGeoJson(collection), [collection]);
  const selectedFeature = useMemo(
    () => geoJsonData.features.find((feature: MapFeature) => feature.id === featureId),
    [geoJsonData, featureId]
  );

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

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      defaultMode: 'simple_select',
    });

    const resumeDrawingMode = () => {
      const state = useDrawingStore.getState();
      if (state.mode === 'drawing' && state.intent) {
        changeDrawMode(draw, getDrawModeForIntent(state.intent));
      }
    };

    const handleDrawCreate = (event: DrawCreateEvent) => {
      const state = useDrawingStore.getState();
      if (state.mode !== 'drawing' || !state.intent) {
        return;
      }

      const [created] = event.features as DrawFeature[];
      if (!created || !created.geometry) {
        return;
      }

      const geometry = fromGeoJsonGeometry(created.geometry as GeoJsonGeometry);
      state.markSaving();
      draw.deleteAll();

      createFeatureMutateRef.current(
        {
          kind: state.intent,
          geometry,
          tags: {},
        },
        {
          onSuccess: () => {
            useDrawingStore.getState().completeDrawing();
            resumeDrawingMode();
          },
          onError: (mutationError) => {
            const message =
              mutationError instanceof ApiError
                ? mutationError.message
                : 'Failed to create feature.';
            useDrawingStore.getState().fail(message);
            resumeDrawingMode();
          },
        }
      );
    };

    const handleDrawUpdate = (event: DrawUpdateEvent) => {
      const state = useDrawingStore.getState();
      if (state.mode !== 'editing' || !state.editing) {
        return;
      }

      const [updated] = event.features as DrawFeature[];
      if (!updated || !updated.geometry) {
        return;
      }

      state.setEditingDraft(fromGeoJsonGeometry(updated.geometry as GeoJsonGeometry));
    };

    const handleSelectionChange = (event: DrawSelectionChangeEvent) => {
      const state = useDrawingStore.getState();
      if (state.mode !== 'editing' || !state.editing) {
        return;
      }

      const isSelected = event.features.some((feature) => feature.id === state.editing?.featureId);
      if (!isSelected) {
        changeDrawMode(draw, 'direct_select', { featureId: state.editing.featureId });
      }
    };

    const handleModeChange = (event: DrawModeChangeEvent) => {
      const state = useDrawingStore.getState();
      if (state.mode === 'drawing' && state.intent && !state.isSaving && event.mode === 'simple_select') {
        changeDrawMode(draw, getDrawModeForIntent(state.intent));
      }
    };

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl(ATTRIBUTION_OPTIONS));
    const drawControl = draw as unknown as maplibregl.IControl;
    map.addControl(drawControl, 'top-left');

    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.selectionchange', handleSelectionChange);
    map.on('draw.modechange', handleModeChange);

    map.on('load', () => {
      if (!map.getSource(FEATURE_SOURCE_ID)) {
        map.addSource(FEATURE_SOURCE_ID, {
          type: 'geojson',
          data: EMPTY_GEOJSON,
        });
      }

      map.addLayer({
        id: FEATURE_FILL_LAYER_ID,
        type: 'fill',
        source: FEATURE_SOURCE_ID,
        paint: {
          'fill-color': BASE_FILL_COLOR,
          'fill-opacity': 0.25,
        },
        filter: BASE_FILL_FILTER,
      });

      map.addLayer({
        id: FEATURE_LINE_LAYER_ID,
        type: 'line',
        source: FEATURE_SOURCE_ID,
        paint: {
          'line-color': BASE_LINE_COLOR,
          'line-width': 2,
        },
        filter: BASE_LINE_FILTER,
      });

      map.addLayer({
        id: FEATURE_POINT_LAYER_ID,
        type: 'circle',
        source: FEATURE_SOURCE_ID,
        paint: {
          'circle-color': BASE_POINT_COLOR,
          'circle-radius': 6,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
        filter: BASE_POINT_FILTER,
      });

      map.addLayer({
        id: SELECTED_FILL_LAYER_ID,
        type: 'fill',
        source: FEATURE_SOURCE_ID,
        paint: {
          'fill-color': HIGHLIGHT_COLOR,
          'fill-opacity': 0.35,
        },
        filter: ['all', BASE_FILL_FILTER, ['==', '$id', '__none__']] as LegacyFilterSpecification,
      });

      map.addLayer({
        id: SELECTED_LINE_LAYER_ID,
        type: 'line',
        source: FEATURE_SOURCE_ID,
        paint: {
          'line-color': HIGHLIGHT_COLOR,
          'line-width': 4,
        },
        filter: ['all', BASE_LINE_FILTER, ['==', '$id', '__none__']] as LegacyFilterSpecification,
      });

      map.addLayer({
        id: SELECTED_POINT_LAYER_ID,
        type: 'circle',
        source: FEATURE_SOURCE_ID,
        paint: {
          'circle-color': HIGHLIGHT_COLOR,
          'circle-radius': 9,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
        filter: ['all', BASE_POINT_FILTER, ['==', '$id', '__none__']] as LegacyFilterSpecification,
      });

      sourceReadyRef.current = true;
    });

    mapRef.current = map;
    drawRef.current = draw;

    return () => {
      map.off('draw.create', handleDrawCreate);
      map.off('draw.update', handleDrawUpdate);
      map.off('draw.selectionchange', handleSelectionChange);
      map.off('draw.modechange', handleModeChange);

      sourceReadyRef.current = false;
      hasFitToAllRef.current = false;
      lastSelectedRef.current = undefined;

      if (drawRef.current) {
        map.removeControl(drawControl);
        drawRef.current = null;
      }

      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) {
      return;
    }

    if (drawingMode === 'drawing') {
      draw.deleteAll();
      if (drawingIntent) {
        changeDrawMode(draw, getDrawModeForIntent(drawingIntent));
      }
      return;
    }

    if (drawingMode === 'editing' && editingFeatureId) {
      const editing = useDrawingStore.getState().editing;
      if (!editing) {
        return;
      }

      draw.deleteAll();
      draw.add({
        id: editing.featureId,
        type: 'Feature',
        properties: {},
        geometry: toGeoJsonGeometry(editing.draftGeometry),
      } as DrawFeature);
      changeDrawMode(draw, 'direct_select', { featureId: editing.featureId });
      return;
    }

    draw.deleteAll();
    changeDrawMode(draw, 'simple_select');
  }, [drawingMode, drawingIntent, editingFeatureId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (drawingMode === 'drawing') {
      map.doubleClickZoom.disable();
    } else {
      map.doubleClickZoom.enable();
    }
  }, [drawingMode]);

  useEffect(() => {
    if (!mapRef.current || !sourceReadyRef.current) {
      return;
    }

    const map = mapRef.current;
    const source = map.getSource(FEATURE_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    source.setData(geoJsonData);

    if (!hasFitToAllRef.current && geoJsonData.features.length > 0 && !featureId) {
      const bounds = getCollectionBounds(geoJsonData);
      if (bounds) {
        map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
        hasFitToAllRef.current = true;
      }
    }
  }, [geoJsonData, featureId]);

  useEffect(() => {
    if (!mapRef.current || !sourceReadyRef.current) {
      return;
    }

    const map = mapRef.current;
    updateHighlightFilters(map, featureId);

    if (!featureId) {
      lastSelectedRef.current = undefined;
      return;
    }

    if (!selectedFeature) {
      return;
    }

    if (lastSelectedRef.current === featureId) {
      return;
    }

    const bounds = getFeatureBounds(selectedFeature);
    if (bounds) {
      map.fitBounds(bounds, { padding: 64, maxZoom: 18 });
      hasFitToAllRef.current = true;
    }
    lastSelectedRef.current = featureId;
  }, [featureId, selectedFeature]);

  return <div ref={containerRef} className="map-view" aria-label="MapLibre map" role="presentation" />;
}
