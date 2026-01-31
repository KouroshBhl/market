import { envSchema } from './env.schema';

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.format();
    console.error('❌ Invalid environment variables:', errors);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
