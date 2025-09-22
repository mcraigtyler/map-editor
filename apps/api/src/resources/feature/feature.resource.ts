import { FeatureKind } from '../../data/entities/feature.entity';
import { BBox } from '../../utils/bbox';

export type GeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon';

export interface GeometryDto {
  type: GeometryType;
  coordinates: unknown;
}

export interface FeatureProperties {
  kind: FeatureKind;
  tags: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureResponse {
  type: 'Feature';
  id: string;
  geometry: GeometryDto;
  properties: FeatureProperties;
}

export interface FeatureCollectionResponse {
  type: 'FeatureCollection';
  features: FeatureResponse[];
  bbox?: number[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CreateFeatureRequest {
  kind: FeatureKind;
  geometry: GeometryDto;
  tags?: Record<string, string>;
}

export type UpdateFeatureRequest = CreateFeatureRequest;

export interface UpdateFeatureTagsRequest {
  set?: Record<string, string>;
  delete?: string[];
}

export interface FeatureListQuery {
  bbox?: BBox;
  limit?: number;
  offset?: number;
}
