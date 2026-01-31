import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const VersionResponseSchema = z.object({
  name: z.string(),
  version: z.string(),
}).openapi('VersionResponse');

export type VersionResponse = z.infer<typeof VersionResponseSchema>;
