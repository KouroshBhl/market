import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { DeliveryTypeSchema } from './delivery-type.schema';

extendZodWithOpenApi(z);

export const CreateProductDraftSchema = z.object({
  deliveryType: DeliveryTypeSchema,
}).openapi('CreateProductDraft');

export const UpdateProductDraftSchema = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
}).openapi('UpdateProductDraft');

export const ProductDraftSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  deliveryType: DeliveryTypeSchema,
  categoryId: z.string().uuid().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ProductDraft');

export type CreateProductDraft = z.infer<typeof CreateProductDraftSchema>;
export type UpdateProductDraft = z.infer<typeof UpdateProductDraftSchema>;
export type ProductDraft = z.infer<typeof ProductDraftSchema>;
