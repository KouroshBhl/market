import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('4000'),
  APP_NAME: z.string().default('Market API'),
  APP_VERSION: z.string().default('0.0.1'),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().transform((val) => val.split(',')).default('http://localhost:3000'),
  // Auth
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-me'),
  // Google OAuth (optional in dev)
  GOOGLE_CLIENT_ID: z.string().default('not-set'),
  GOOGLE_CLIENT_SECRET: z.string().default('not-set'),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:4000/auth/google/callback'),
  SELLER_APP_URL: z.string().default('http://localhost:3002'),
  API_BASE_URL: z.string().default('http://localhost:4000'),
  // Postmark (optional in dev — emails logged to console if not set)
  POSTMARK_SERVER_TOKEN: z.string().optional(),
  POSTMARK_MESSAGE_STREAM: z.string().default('transactional'),
  EMAIL_FROM: z.string().default('VendorsGG <owner@vendorsgg.com>'),
});

export type Env = z.infer<typeof envSchema>;
