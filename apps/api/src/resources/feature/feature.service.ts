import { Geometry } from 'geojson';
import { FeatureEntity, FeatureKind } from '../../data/entities/feature.entity';
import { FeatureRepository } from '../../data/repositories/feature.repository';
import { isValidGeometry } from '../../utils/geometry';
import { InternalServerError, NotFoundError, ValidationError } from '../../utils/errors';
import {
  CreateFeatureRequest,
  FeatureCollectionResponse,
  FeatureListQuery,
  FeatureProperties,
  FeatureResponse,
  GeometryDto,
  GeometryType,
  UpdateFeatureRequest,
} from './feature.resource';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const DEFAULT_OFFSET = 0;
const GEOMETRY_BY_KIND: Record<FeatureKind, GeometryType[]> = {
  point: ['Point', 'MultiPoint'],
  line: ['LineString', 'MultiLineString'],
  polygon: ['Polygon', 'MultiPolygon'],
  road: ['LineString', 'MultiLineString'],
};
const SUPPORTED_GEOMETRY_TYPES = new Set<GeometryType>(
  Object.values(GEOMETRY_BY_KIND).flat() as GeometryType[]
);

export class FeatureService {
  constructor(private readonly repository = new FeatureRepository()) {}

  async listFeatures(query: FeatureListQuery): Promise<FeatureCollectionResponse> {
    const limit = this.validateLimit(query.limit);
    const offset = this.validateOffset(query.offset);
    const bbox = query.bbox;

    const { data, total } = await this.repository.list({ bbox, limit, offset });
    const features = data.map((entity) => this.toFeatureResponse(entity));

    const collection: FeatureCollectionResponse = {
      type: 'FeatureCollection',
      features,
      pagination: {
        total,
        limit,
        offset,
      },
    };

    if (bbox) {
      collection.bbox = bbox;
    }

    return collection;
  }

  async getFeature(id: string): Promise<FeatureResponse> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundError('Feature', id);
    }
    return this.toFeatureResponse(entity);
  }

  async createFeature(payload: CreateFeatureRequest): Promise<FeatureResponse> {
    const tags = this.validateTags(payload.tags);
    const geometry = this.normalizeGeometry(payload.geometry, payload.kind);
    const entity = await this.repository.create({
      kind: payload.kind,
      geometry,
      tags,
    });
    return this.toFeatureResponse(entity);
  }

  async updateFeature(id: string, payload: UpdateFeatureRequest): Promise<FeatureResponse> {
    const tags = this.validateTags(payload.tags);
    const geometry = this.normalizeGeometry(payload.geometry, payload.kind);
    const entity = await this.repository.update(id, {
      kind: payload.kind,
      geometry,
      tags,
    });
    if (!entity) {
      throw new NotFoundError('Feature', id);
    }
    return this.toFeatureResponse(entity);
  }

  async deleteFeature(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Feature', id);
    }
  }

  private validateLimit(limit?: number): number {
    if (limit === undefined) {
      return DEFAULT_LIMIT;
    }
    if (!Number.isInteger(limit)) {
      throw new ValidationError('limit must be an integer', { limit });
    }
    if (limit <= 0) {
      throw new ValidationError('limit must be greater than zero', { limit });
    }
    if (limit > MAX_LIMIT) {
      throw new ValidationError(`limit must be less than or equal to ${MAX_LIMIT}`, { limit });
    }
    return limit;
  }

  private validateOffset(offset?: number): number {
    if (offset === undefined) {
      return DEFAULT_OFFSET;
    }
    if (!Number.isInteger(offset)) {
      throw new ValidationError('offset must be an integer', { offset });
    }
    if (offset < 0) {
      throw new ValidationError('offset must be greater than or equal to zero', { offset });
    }
    return offset;
  }

  private validateTags(tags?: Record<string, unknown>): Record<string, unknown> {
    if (tags === undefined) {
      return {};
    }
    if (tags === null || typeof tags !== 'object' || Array.isArray(tags)) {
      throw new ValidationError('tags must be an object', { tags });
    }
    return { ...tags };
  }

  private normalizeGeometry(input: GeometryDto, kind: FeatureKind): Geometry {
    const candidate = input as unknown;
    if (!isValidGeometry(candidate)) {
      throw new ValidationError('geometry must be a valid GeoJSON geometry object');
    }

    const geometry = candidate as Geometry;
    if (!this.isSupportedGeometryType(geometry.type)) {
      throw new ValidationError('geometry type is not supported', { geometryType: geometry.type });
    }

    const allowed = GEOMETRY_BY_KIND[kind];
    if (!allowed.includes(geometry.type as GeometryType)) {
      throw new ValidationError('geometry type is incompatible with feature kind', {
        kind,
        geometryType: geometry.type,
      });
    }

    return geometry;
  }

  private toFeatureResponse(entity: FeatureEntity): FeatureResponse {
    const geometry = this.parseGeometry(entity.geom);
    const geometryDto = this.toGeometryDto(geometry);
    const properties: FeatureProperties = {
      kind: entity.kind,
      tags: this.cloneTags(entity.tags),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };

    return {
      type: 'Feature',
      id: entity.id,
      geometry: geometryDto,
      properties,
    };
  }

  private parseGeometry(geometry: FeatureEntity['geom']): Geometry {
    if (typeof geometry === 'string') {
      try {
        return JSON.parse(geometry);
      } catch (error) {
        throw new InternalServerError('Stored geometry is malformed', { error });
      }
    }

    if (geometry && typeof geometry === 'object') {
      return geometry as Geometry;
    }

    throw new InternalServerError('Stored geometry is missing or invalid');
  }

  private toGeometryDto(geometry: Geometry): GeometryDto {
    if (!this.isSupportedGeometryType(geometry.type)) {
      throw new InternalServerError('Stored geometry type is unsupported', { geometryType: geometry.type });
    }
    return geometry as unknown as GeometryDto;
  }

  private cloneTags(tags: FeatureEntity['tags']): Record<string, unknown> {
    if (tags === null || tags === undefined) {
      return {};
    }
    if (typeof tags !== 'object' || Array.isArray(tags)) {
      throw new InternalServerError('Stored tags are invalid');
    }
    return { ...tags };
  }

  private isSupportedGeometryType(type: Geometry['type']): type is GeometryType {
    return SUPPORTED_GEOMETRY_TYPES.has(type as GeometryType);
  }
}
