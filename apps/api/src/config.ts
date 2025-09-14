import { z } from 'zod';
import { version as packageVersion } from '../package.json';

const envSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.parse(process.env);

export const config = {
  env: parsed.NODE_ENV,
  port: parsed.PORT ? Number(parsed.PORT) : 3000,
  version: packageVersion,
};
