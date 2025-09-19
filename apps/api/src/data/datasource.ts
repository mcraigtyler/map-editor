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
  entities: ['dist/data/entities/*.entity.{ts,js}'],
  migrations: ['dist/data/migrations/*.{ts,js}'],
  synchronize: false,
  migrationsTableName: 'migration',
  migrationsTransactionMode: 'each',
  logging: 'all',
  logger: 'advanced-console',  
});

