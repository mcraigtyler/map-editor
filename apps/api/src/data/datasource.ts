import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { FeatureEntity } from './entities/feature.entity';
import { Init1700000000000 } from './migrations/1700000000000-Init';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.database,
  entities: [FeatureEntity],
  migrations: [Init1700000000000],
  synchronize: false,
});

