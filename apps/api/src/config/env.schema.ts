import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('4000'),
  APP_NAME: z.string().default('Market API'),
  APP_VERSION: z.string().default('0.0.1'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().transform((val) => val.split(',')).default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;
