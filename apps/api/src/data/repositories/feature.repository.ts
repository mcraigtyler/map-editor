import { Geometry } from 'geojson';
import { AppDataSource } from '../datasource';
import { FeatureEntity, FeatureKind } from '../entities/feature.entity';
import { BBox } from '../../utils/bbox';
import { InternalServerError } from '../../utils/errors';

export interface FeatureListParams {
  bbox?: BBox;
  limit: number;
  offset: number;
}

export interface FeatureCreateParams {
  kind: FeatureKind;
  geometry: Geometry;
  tags: Record<string, unknown>;
}

export type FeatureUpdateParams = FeatureCreateParams;

export class FeatureRepository {
  private readonly repository = AppDataSource.getRepository(FeatureEntity);

  async findById(id: string): Promise<FeatureEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async list(params: FeatureListParams): Promise<{ data: FeatureEntity[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('feature')
      .orderBy('feature.createdAt', 'DESC')
      .skip(params.offset)
      .take(params.limit);

    if (params.bbox) {
      queryBuilder.andWhere(
        'feature.geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)',
        {
          west: params.bbox[0],
          south: params.bbox[1],
          east: params.bbox[2],
          north: params.bbox[3],
        }
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async create(params: FeatureCreateParams): Promise<FeatureEntity> {
    const result = await this.repository
      .createQueryBuilder()
      .insert()
      .values({
        kind: params.kind,
        tags: () => ':tags::jsonb',
        geom: () => 'ST_SetSRID(ST_GeomFromGeoJSON(:geometry), 4326)',
      })
      .setParameters({
        geometry: JSON.stringify(params.geometry),
        tags: JSON.stringify(params.tags ?? {}),
      })
      .returning('*')
      .execute();

    const inserted = result.identifiers[0] as { id?: string } | undefined;
    if (!inserted?.id) {
      throw new InternalServerError('Feature could not be persisted');
    }

    const entity = await this.findById(inserted.id);
    if (!entity) {
      throw new InternalServerError('Feature could not be loaded after creation');
    }

    return entity;
  }

  async update(id: string, params: FeatureUpdateParams): Promise<FeatureEntity | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        kind: params.kind,
        tags: () => ':tags::jsonb',
        geom: () => 'ST_SetSRID(ST_GeomFromGeoJSON(:geometry), 4326)',
      })
      .where('id = :id', { id })
      .setParameters({
        geometry: JSON.stringify(params.geometry),
        tags: JSON.stringify(params.tags ?? {}),
      })
      .returning('*')
      .execute();

    const updatedRow = result.raw[0] as { id?: string } | undefined;
    if (!updatedRow?.id) {
      return null;
    }

    return this.findById(updatedRow.id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return Boolean(result.affected && result.affected > 0);
  }
}
