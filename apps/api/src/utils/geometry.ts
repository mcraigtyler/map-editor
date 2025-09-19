import { GeoJSON } from 'geojson';
import gjv from 'geojson-validation';

export function isValidGeometry(geometry: unknown): geometry is GeoJSON {
  return typeof geometry === 'object' && geometry !== null && gjv.isGeoJSONObject(geometry);
}

