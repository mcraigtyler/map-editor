import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.database,
  entities: [
    'src/data/entities/*.entity.ts',
    'dist/data/entities/*.entity.js',
  ],
  migrations: [
    'src/data/migrations/*.ts',
    'dist/data/migrations/*.js',
  ],
  synchronize: false,
  migrationsTableName: 'migration',
  migrationsTransactionMode: 'each',
  logging: 'all',
  logger: 'advanced-console',
});

