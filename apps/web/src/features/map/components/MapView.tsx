import maplibregl, {
  GeoJSONSource,
  LegacyFilterSpecification,
  LngLatLike,
  Map,
  MapLayerMouseEvent,
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
  LineString,
} from 'geojson';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '~/lib/apiClient';
import { useCreateFeatureMutation, useFeatureList } from '~/features/feature/hooks';
import type { FeatureCollection, FeatureProperties } from '~/features/feature/types';
import {
  LANELET_OFFSET_STEP_METERS,
  useDrawingStore,
} from '~/features/drawing/state';
import type { DrawingIntent } from '~/features/drawing/state';
import {
  createLaneletGeometry,
  fromGeoJsonGeometry,
  toGeoJsonGeometry,
  computeLaneletSegments,
} from '~/features/drawing/utils';

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
const LANELET_SEGMENTS_SOURCE_ID = 'lanelet-segments';
const LANELET_SEGMENT_CENTER_LAYER_ID = 'lanelet-centerline';
const LANELET_SEGMENT_OUTER_LAYER_ID = 'lanelet-outers';
const SELECTED_LANELET_CENTER_LAYER_ID = 'selected-lanelet-centerline';
const SELECTED_LANELET_OUTER_LAYER_ID = 'selected-lanelet-outers';
const LANELET_PREVIEW_SOURCE_ID = 'lanelet-preview';
const LANELET_PREVIEW_CENTER_LAYER_ID = 'lanelet-preview-centerline';
const LANELET_PREVIEW_OUTER_LAYER_ID = 'lanelet-preview-outers';

const BASE_POINT_COLOR = '#2563eb';
const BASE_LINE_COLOR = '#2563eb';
const BASE_FILL_COLOR = '#38bdf8';
const HIGHLIGHT_LINE_COLOR = '#facc15';
const HIGHLIGHT_FILL_COLOR = '#fde68a';
const HIGHLIGHT_POINT_COLOR = '#facc15';
const LANELET_CENTER_COLOR = '#16a34a';
const LANELET_OUTER_COLOR = '#15803d';
const LANELET_PREVIEW_COLOR = '#0f172a';
const LANELET_HIGHLIGHT_COLOR = '#facc15';

const BASE_LINE_FILTER: LegacyFilterSpecification = [
  'all',
  ['in', '$type', 'LineString', 'Polygon'],
  ['!=', 'kind', 'lanelet'],
];
const BASE_FILL_FILTER: LegacyFilterSpecification = ['==', '$type', 'Polygon'];
const BASE_POINT_FILTER: LegacyFilterSpecification = ['==', '$type', 'Point'];

const EMPTY_GEOJSON: MapFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

type LaneletRole = 'left' | 'center' | 'right';

interface LaneletSegmentProperties extends FeatureProperties {
  featureId: string;
  laneletRole: LaneletRole;
}

type LaneletSegmentFeature = GeoJsonFeature<LineString, LaneletSegmentProperties>;
type LaneletSegmentCollection = GeoJsonFeatureCollection<LineString, LaneletSegmentProperties>;

const EMPTY_LANELET_SEGMENTS: LaneletSegmentCollection = {
  type: 'FeatureCollection',
  features: [],
};

const EMPTY_LANELET_PREVIEW: GeoJsonFeatureCollection<LineString, { laneletRole: LaneletRole }> = {
  type: 'FeatureCollection',
  features: [],
};

const LANELET_ROLES: LaneletRole[] = ['left', 'center', 'right'];

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
    case 'lanelet':
      return 'draw_line_string';
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

function toLaneletSegments(collection: MapFeatureCollection): LaneletSegmentCollection {
  const features: LaneletSegmentFeature[] = [];

  collection.features.forEach((feature) => {
    if (feature.properties.kind !== 'lanelet') {
      return;
    }

    if (feature.geometry.type !== 'MultiLineString') {
      return;
    }

    const coordinates = (
      feature.geometry as GeoJsonGeometry & { coordinates: LineString['coordinates'][] }
    ).coordinates;
    coordinates.forEach((segmentCoordinates, index) => {
      if (!Array.isArray(segmentCoordinates) || segmentCoordinates.length === 0) {
        return;
      }

      const role = LANELET_ROLES[index] ?? 'left';
      const lineCoordinates = segmentCoordinates as LineString['coordinates'];

      features.push({
        type: 'Feature',
        id: `${String(feature.id)}::${role}`,
        properties: {
          ...feature.properties,
          featureId: String(feature.id),
          laneletRole: role,
        },
        geometry: {
          type: 'LineString',
          coordinates: lineCoordinates,
        },
      });
    });
  });

  return {
    type: 'FeatureCollection',
    features,
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

  const laneletIdFilter: LegacyFilterSpecification = featureId
    ? ['in', '$id', `${featureId}::left`, `${featureId}::center`, `${featureId}::right`]
    : ['==', '$id', '__none__'];

  const laneletHighlightFilters: Array<[string, LegacyFilterSpecification]> = [
    [
      SELECTED_LANELET_CENTER_LAYER_ID,
      ['all', ['==', 'laneletRole', 'center'], laneletIdFilter] as LegacyFilterSpecification,
    ],
    [
      SELECTED_LANELET_OUTER_LAYER_ID,
      ['all', ['!=', 'laneletRole', 'center'], laneletIdFilter] as LegacyFilterSpecification,
    ],
  ];

  laneletHighlightFilters.forEach(([layerId, filter]) => {
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
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const { mutate: createFeature } = useCreateFeatureMutation();
  const createFeatureMutateRef = useRef(createFeature);
  useEffect(() => {
    createFeatureMutateRef.current = createFeature;
  }, [createFeature]);

  const drawingMode = useDrawingStore((state) => state.mode);
  const drawingIntent = useDrawingStore((state) => state.intent);
  const editingFeatureId = useDrawingStore((state) => state.editing?.featureId);
  const laneletOffset = useDrawingStore((state) => state.laneletOffset);

  const { featureId } = useParams<{ featureId: string }>();
  const { data: collection } = useFeatureList();

  const geoJsonData = useMemo(() => toGeoJson(collection), [collection]);
  const laneletSegments = useMemo(() => toLaneletSegments(geoJsonData), [geoJsonData]);
  const selectedFeature = useMemo(
    () => geoJsonData.features.find((feature: MapFeature) => feature.id === featureId),
    [geoJsonData, featureId]
  );

  const updateLaneletPreview = useCallback(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) {
      return;
    }

    const source = map.getSource(LANELET_PREVIEW_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    const state = useDrawingStore.getState();
    if (state.mode !== 'drawing' || state.intent !== 'lanelet') {
      source.setData(EMPTY_LANELET_PREVIEW);
      return;
    }

    const all = draw.getAll();
    const [draft] = all.features as DrawFeature[];
    if (!draft || !draft.geometry || draft.geometry.type !== 'LineString') {
      source.setData(EMPTY_LANELET_PREVIEW);
      return;
    }

    const coordinates = (
      draft.geometry as GeoJsonGeometry & { coordinates: LineString['coordinates'] }
    ).coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      source.setData(EMPTY_LANELET_PREVIEW);
      return;
    }

    const segments = computeLaneletSegments(coordinates, state.laneletOffset);
    if (!segments) {
      source.setData(EMPTY_LANELET_PREVIEW);
      return;
    }

    const previewFeatures: GeoJsonFeature<LineString, { laneletRole: LaneletRole }>[] = [
      {
        type: 'Feature',
        id: 'preview-left',
        properties: { laneletRole: 'left' },
        geometry: {
          type: 'LineString',
          coordinates: segments.left,
        },
      },
      {
        type: 'Feature',
        id: 'preview-center',
        properties: { laneletRole: 'center' },
        geometry: {
          type: 'LineString',
          coordinates: segments.center,
        },
      },
      {
        type: 'Feature',
        id: 'preview-right',
        properties: { laneletRole: 'right' },
        geometry: {
          type: 'LineString',
          coordinates: segments.right,
        },
      },
    ];

    source.setData({
      type: 'FeatureCollection',
      features: previewFeatures,
    });
  }, []);

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
        updateLaneletPreview();
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

      let geometry = fromGeoJsonGeometry(created.geometry as GeoJsonGeometry);

      if (state.intent === 'lanelet') {
        const laneletCoordinates = (
          created.geometry as GeoJsonGeometry & { coordinates: LineString['coordinates'] }
        ).coordinates;
        const laneletGeometry = createLaneletGeometry(laneletCoordinates, state.laneletOffset);
        if (!laneletGeometry) {
          useDrawingStore.getState().fail('Unable to generate lanelet geometry. Try drawing a longer centerline.');
          draw.deleteAll();
          return;
        }
        geometry = laneletGeometry;
      }
      state.markSaving();
      draw.deleteAll();
      updateLaneletPreview();

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
      updateLaneletPreview();
    };

    const handleFeatureClick = (event: MapLayerMouseEvent) => {
      const state = useDrawingStore.getState();
      if (state.mode !== 'selecting') {
        return;
      }

      const features = event.features as (MapFeature | LaneletSegmentFeature)[] | undefined;
      if (!features || features.length === 0) {
        return;
      }

      const [clicked] = features;

      const properties = clicked?.properties as Partial<LaneletSegmentProperties> | undefined;
      const featureId = properties?.featureId ?? (clicked?.id as string | number | undefined);
      if (featureId === undefined || featureId === null) {
        return;
      }

      navigateRef.current(`/features/${String(featureId)}`);
      useDrawingStore.getState().reset();
    };

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl(ATTRIBUTION_OPTIONS));
    const drawControl = draw as unknown as maplibregl.IControl;
    map.addControl(drawControl, 'top-left');

    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.selectionchange', handleSelectionChange);
    map.on('draw.modechange', handleModeChange);
    map.on('draw.render', updateLaneletPreview);
    map.on('click', FEATURE_FILL_LAYER_ID, handleFeatureClick);
    map.on('click', FEATURE_LINE_LAYER_ID, handleFeatureClick);
    map.on('click', FEATURE_POINT_LAYER_ID, handleFeatureClick);
    map.on('click', LANELET_SEGMENT_CENTER_LAYER_ID, handleFeatureClick);
    map.on('click', LANELET_SEGMENT_OUTER_LAYER_ID, handleFeatureClick);

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

      if (!map.getSource(LANELET_SEGMENTS_SOURCE_ID)) {
        map.addSource(LANELET_SEGMENTS_SOURCE_ID, {
          type: 'geojson',
          data: EMPTY_LANELET_SEGMENTS,
        });
      }

      map.addLayer({
        id: LANELET_SEGMENT_OUTER_LAYER_ID,
        type: 'line',
        source: LANELET_SEGMENTS_SOURCE_ID,
        paint: {
          'line-color': LANELET_OUTER_COLOR,
          'line-width': 3.5,
        },
        filter: ['all', ['!=', 'laneletRole', 'center']] as LegacyFilterSpecification,
      });

      map.addLayer({
        id: LANELET_SEGMENT_CENTER_LAYER_ID,
        type: 'line',
        source: LANELET_SEGMENTS_SOURCE_ID,
        paint: {
          'line-color': LANELET_CENTER_COLOR,
          'line-width': 2.5,
          'line-dasharray': [0.4, 1.1],
        },
        filter: ['all', ['==', 'laneletRole', 'center']] as LegacyFilterSpecification,
      });

      map.addLayer({
        id: SELECTED_FILL_LAYER_ID,
        type: 'fill',
        source: FEATURE_SOURCE_ID,
        paint: {
          'fill-color': HIGHLIGHT_FILL_COLOR,
          'fill-opacity': 0.45,
          'fill-outline-color': HIGHLIGHT_LINE_COLOR,
        },
        filter: ['all', BASE_FILL_FILTER, ['==', '$id', '__none__']] as LegacyFilterSpecification,
      });

      map.addLayer({
        id: SELECTED_LINE_LAYER_ID,
        type: 'line',
        source: FEATURE_SOURCE_ID,
        paint: {
          'line-color': HIGHLIGHT_LINE_COLOR,
          'line-width': 5,
          'line-blur': 0.5,
        },
        filter: ['all', BASE_LINE_FILTER, ['==', '$id', '__none__']] as LegacyFilterSpecification,
      });

      map.addLayer({
        id: SELECTED_POINT_LAYER_ID,
        type: 'circle',
        source: FEATURE_SOURCE_ID,
        paint: {
          'circle-color': HIGHLIGHT_POINT_COLOR,
          'circle-radius': 10,
          'circle-blur': 0.2,
          'circle-opacity': 0.95,
          'circle-stroke-color': '#fef3c7',
          'circle-stroke-width': 3,
        },
        filter: ['all', BASE_POINT_FILTER, ['==', '$id', '__none__']] as LegacyFilterSpecification,
      });

      map.addLayer({
        id: SELECTED_LANELET_OUTER_LAYER_ID,
        type: 'line',
        source: LANELET_SEGMENTS_SOURCE_ID,
        paint: {
          'line-color': LANELET_HIGHLIGHT_COLOR,
          'line-width': 6,
          'line-opacity': 0.85,
        },
        filter: ['all', ['!=', 'laneletRole', 'center'], ['==', '$id', '__none__']] as LegacyFilterSpecification,
      });

      map.addLayer({
        id: SELECTED_LANELET_CENTER_LAYER_ID,
        type: 'line',
        source: LANELET_SEGMENTS_SOURCE_ID,
        paint: {
          'line-color': LANELET_HIGHLIGHT_COLOR,
          'line-width': 4.5,
          'line-dasharray': [0.2, 0.4],
          'line-opacity': 0.9,
        },
        filter: ['all', ['==', 'laneletRole', 'center'], ['==', '$id', '__none__']] as LegacyFilterSpecification,
      });

      if (!map.getSource(LANELET_PREVIEW_SOURCE_ID)) {
        map.addSource(LANELET_PREVIEW_SOURCE_ID, {
          type: 'geojson',
          data: EMPTY_LANELET_PREVIEW,
        });
      }

      map.addLayer({
        id: LANELET_PREVIEW_OUTER_LAYER_ID,
        type: 'line',
        source: LANELET_PREVIEW_SOURCE_ID,
        paint: {
          'line-color': LANELET_PREVIEW_COLOR,
          'line-width': 3,
          'line-opacity': 0.5,
        },
        filter: ['all', ['!=', 'laneletRole', 'center']] as LegacyFilterSpecification,
      });

      map.addLayer({
        id: LANELET_PREVIEW_CENTER_LAYER_ID,
        type: 'line',
        source: LANELET_PREVIEW_SOURCE_ID,
        paint: {
          'line-color': LANELET_PREVIEW_COLOR,
          'line-width': 2,
          'line-dasharray': [0.2, 0.6],
          'line-opacity': 0.6,
        },
        filter: ['all', ['==', 'laneletRole', 'center']] as LegacyFilterSpecification,
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
      map.off('draw.render', updateLaneletPreview);
      map.off('click', FEATURE_FILL_LAYER_ID, handleFeatureClick);
      map.off('click', FEATURE_LINE_LAYER_ID, handleFeatureClick);
      map.off('click', FEATURE_POINT_LAYER_ID, handleFeatureClick);
      map.off('click', LANELET_SEGMENT_CENTER_LAYER_ID, handleFeatureClick);
      map.off('click', LANELET_SEGMENT_OUTER_LAYER_ID, handleFeatureClick);

      sourceReadyRef.current = false;
      hasFitToAllRef.current = false;
      lastSelectedRef.current = undefined;

      if (drawRef.current) {
        map.removeControl(drawControl);
        drawRef.current = null;
      }

      map.getCanvas().style.cursor = '';
      mapRef.current = null;
      map.remove();
    };
  }, [updateLaneletPreview]);

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
    updateLaneletPreview();
  }, [drawingMode, drawingIntent, laneletOffset, updateLaneletPreview]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const state = useDrawingStore.getState();
      if (state.mode !== 'drawing' || state.intent !== 'lanelet') {
        return;
      }

      if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        useDrawingStore.getState().adjustLaneletOffset(LANELET_OFFSET_STEP_METERS);
        updateLaneletPreview();
      }

      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        useDrawingStore.getState().adjustLaneletOffset(-LANELET_OFFSET_STEP_METERS);
        updateLaneletPreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateLaneletPreview]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (drawingMode === 'selecting') {
      map.getCanvas().style.cursor = 'pointer';
    } else if (map.getCanvas().style.cursor === 'pointer') {
      map.getCanvas().style.cursor = '';
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
    const source = map.getSource(LANELET_SEGMENTS_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    source.setData(laneletSegments);
  }, [laneletSegments]);

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
