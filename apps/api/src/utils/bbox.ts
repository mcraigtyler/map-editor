import { ValidationError } from './errors';

export type BBox = [number, number, number, number];

export function parseBBox(input: string): BBox {
  const parts = input.split(',').map((part) => part.trim());
  if (parts.length !== 4) {
    throw new ValidationError('bbox must contain four comma-separated numbers', { value: input });
  }

  const values = parts.map((value) => Number(value));
  if (values.some((value) => Number.isNaN(value) || !Number.isFinite(value))) {
    throw new ValidationError('bbox values must be valid numbers', { value: input });
  }

  const [minLon, minLat, maxLon, maxLat] = values as BBox;
  if (minLon >= maxLon || minLat >= maxLat) {
    throw new ValidationError('bbox coordinates must define a valid area', { value: input });
  }

  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
    throw new ValidationError('bbox coordinates must be within WGS84 bounds', { value: input });
  }

  return [minLon, minLat, maxLon, maxLat];
}
