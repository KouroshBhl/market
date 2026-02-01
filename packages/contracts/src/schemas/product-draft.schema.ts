import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { DeliveryTypeSchema } from './delivery-type.schema';

extendZodWithOpenApi(z);

export const CreateProductDraftSchema = z.object({
  deliveryType: DeliveryTypeSchema,
}).openapi('CreateProductDraft');

export const ProductDraftSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  deliveryType: DeliveryTypeSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ProductDraft');

export type CreateProductDraft = z.infer<typeof CreateProductDraftSchema>;
export type ProductDraft = z.infer<typeof ProductDraftSchema>;
