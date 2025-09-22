import type { Geometry } from 'geojson';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type FeatureKind = 'point' | 'line' | 'polygon' | 'road';

@Entity({ name: 'features' })
export class FeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  kind!: FeatureKind;

  @Column({ type: 'geometry', spatialFeatureType: 'Geometry', srid: 4326 })
  geom!: Geometry;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  tags!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

