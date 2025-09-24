export type FeatureGeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon';

export interface FeatureGeometry {
  type: FeatureGeometryType;
  coordinates: unknown;
}

export interface FeatureProperties {
  kind: 'point' | 'line' | 'polygon' | 'road';
  tags: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type FeatureKind = FeatureProperties['kind'];

export type EditableFeatureKind = Extract<FeatureKind, 'point' | 'line' | 'polygon'>;

export interface Feature {
  type: 'Feature';
  id: string;
  geometry: FeatureGeometry;
  properties: FeatureProperties;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
  bbox?: number[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export type FeatureListParams = {
  bbox?: [number, number, number, number];
  limit?: number;
  offset?: number;
};

export interface FeatureMutationPayload {
  kind: FeatureKind;
  geometry: FeatureGeometry;
  tags?: Record<string, string>;
}

export interface UpdateFeatureTagsPayload {
  set?: Record<string, string>;
  delete?: string[];
}
