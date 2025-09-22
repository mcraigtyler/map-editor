import type { Geometry as GeoJsonGeometry } from 'geojson';

import type { FeatureGeometry } from '../feature/types';

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
