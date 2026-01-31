import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const HealthResponseSchema = z.object({
  ok: z.boolean(),
}).openapi('HealthResponse');

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
