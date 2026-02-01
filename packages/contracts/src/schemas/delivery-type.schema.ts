import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const DeliveryTypeSchema = z.enum(['AUTO_KEY', 'MANUAL']).openapi('DeliveryType');

export type DeliveryType = z.infer<typeof DeliveryTypeSchema>;
