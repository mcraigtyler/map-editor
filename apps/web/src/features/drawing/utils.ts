import type { Feature as TurfFeature, LineString as TurfLineString } from '@turf/helpers';
import { lineString as toTurfLineString } from '@turf/helpers';
import lineOffset from '@turf/line-offset';
import type { Geometry as GeoJsonGeometry, LineString, MultiLineString } from 'geojson';

import type { FeatureGeometry } from '../feature/types';
import { MIN_LANELET_OFFSET_METERS } from './state';

function cloneCoordinates<T>(coordinates: T): T {
  if (coordinates === undefined) {
    return coordinates;
  }

  return JSON.parse(JSON.stringify(coordinates)) as T;
}

export function cloneGeometry(geometry: FeatureGeometry): FeatureGeometry {
  return {
    type: geometry.type,
    coordinates: cloneCoordinates(geometry.coordinates),
  };
}

export function fromGeoJsonGeometry(geometry: GeoJsonGeometry): FeatureGeometry {
  if (geometry.type === 'GeometryCollection') {
    throw new Error('GeometryCollection geometries are not supported.');
  }

  return {
    type: geometry.type as FeatureGeometry['type'],
    coordinates: cloneCoordinates((geometry as GeoJsonGeometry & { coordinates: unknown }).coordinates),
  };
}

export function toGeoJsonGeometry(geometry: FeatureGeometry): GeoJsonGeometry {
  return {
    type: geometry.type,
    coordinates: cloneCoordinates(geometry.coordinates) as never,
  };
}

export interface LaneletSegments {
  left: LineString['coordinates'];
  center: LineString['coordinates'];
  right: LineString['coordinates'];
}

function ensureLineStringCoordinates(coordinates: unknown): LineString['coordinates'] | undefined {
  if (!Array.isArray(coordinates)) {
    return undefined;
  }

  if (coordinates.length < 2) {
    return undefined;
  }

  const [first] = coordinates;
  if (!Array.isArray(first)) {
    return undefined;
  }

  return coordinates as LineString['coordinates'];
}

export function computeLaneletSegments(
  centerCoordinates: LineString['coordinates'],
  offsetMeters: number
): LaneletSegments | undefined {
  if (offsetMeters < MIN_LANELET_OFFSET_METERS) {
    return undefined;
  }

  const centerLine: TurfFeature<TurfLineString> = toTurfLineString(centerCoordinates);
  const left = lineOffset(centerLine, offsetMeters, { units: 'meters' });
  const right = lineOffset(centerLine, -offsetMeters, { units: 'meters' });

  if (!left.geometry || left.geometry.type !== 'LineString') {
    return undefined;
  }

  if (!right.geometry || right.geometry.type !== 'LineString') {
    return undefined;
  }

  const leftCoordinates = ensureLineStringCoordinates(left.geometry.coordinates);
  const rightCoordinates = ensureLineStringCoordinates(right.geometry.coordinates);
  if (!leftCoordinates || !rightCoordinates) {
    return undefined;
  }

  return {
    left: leftCoordinates,
    center: centerCoordinates,
    right: rightCoordinates,
  };
}

export function createLaneletGeometry(
  centerCoordinates: LineString['coordinates'],
  offsetMeters: number
): FeatureGeometry | undefined {
  const segments = computeLaneletSegments(centerCoordinates, offsetMeters);
  if (!segments) {
    return undefined;
  }

  const coordinates: MultiLineString['coordinates'] = [segments.left, segments.center, segments.right];

  return {
    type: 'MultiLineString',
    coordinates,
  };
}
