import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';

// Determine if we are running the TypeScript sources directly (ts-node / ts-node-dev)
const isTsRuntime = __filename.endsWith('.ts');

const entityGlobs = isTsRuntime
  ? ['src/data/entities/**/*.entity.ts']
  : ['dist/data/entities/**/*.entity.{js,cjs}'];

const migrationGlobs = isTsRuntime
  ? ['src/data/migrations/**/*.{ts}']
  : ['dist/data/migrations/**/*.{js,cjs}'];

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.database,
  // Wildcard entity discovery (TS in dev, compiled JS in prod)
  entities: entityGlobs,
  migrations: migrationGlobs,
  synchronize: false,
  migrationsTableName: 'migration',
  migrationsTransactionMode: 'each',
  logging: 'all',
  logger: 'advanced-console',
});

