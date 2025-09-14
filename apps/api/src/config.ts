import 'dotenv/config';
import { z } from 'zod';
import { version as packageVersion } from '../package.json';

const envSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('maped'),
});

const parsed = envSchema.parse(process.env);

export const config = {
  env: parsed.NODE_ENV,
  port: parsed.PORT ? Number(parsed.PORT) : 3000,
  version: packageVersion,
  db: {
    host: parsed.DB_HOST,
    port: Number(parsed.DB_PORT),
    user: parsed.DB_USER,
    password: parsed.DB_PASSWORD,
    database: parsed.DB_NAME,
  },
};
