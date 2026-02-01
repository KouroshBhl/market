import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { DeliveryTypeSchema } from './delivery-type.schema';
import { CurrencySchema } from './currency.schema';
import { AutoKeyConfigSchema, ManualDeliveryConfigSchema, ProductStatusSchema } from './product.schema';

extendZodWithOpenApi(z);

// Saves/updates a product draft (can be called multiple times during wizard)
export const SaveProductDraftSchema = z.object({
  sellerId: z.string().uuid(),
  deliveryType: DeliveryTypeSchema,
  categoryId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  priceAmount: z.number().int().nonnegative().optional(),
  currency: CurrencySchema.optional(),
  // Delivery config (only one should be provided based on deliveryType)
  autoKeyConfig: AutoKeyConfigSchema.optional(),
  manualDeliveryConfig: ManualDeliveryConfigSchema.optional(),
}).openapi('SaveProductDraft');

// Updates an existing draft
export const UpdateProductDraftSchema = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  priceAmount: z.number().int().nonnegative().optional(),
  currency: CurrencySchema.optional(),
  autoKeyConfig: AutoKeyConfigSchema.optional(),
  manualDeliveryConfig: ManualDeliveryConfigSchema.optional(),
}).openapi('UpdateProductDraft');

// Publish validation - all required fields must be present
export const PublishProductSchema = z.object({
  // Empty - validation happens server-side based on existing draft data
}).openapi('PublishProduct');

// Response schema
export const ProductDraftSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  status: ProductStatusSchema,
  deliveryType: DeliveryTypeSchema,
  categoryId: z.string().uuid().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  priceAmount: z.number().int().nullable(),
  currency: CurrencySchema.nullable(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Include delivery configs in response
  autoKeyConfig: AutoKeyConfigSchema.nullable().optional(),
  manualDeliveryConfig: ManualDeliveryConfigSchema.nullable().optional(),
}).openapi('ProductDraft');

export const UpdateProductStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
}).openapi('UpdateProductStatus');

export type SaveProductDraft = z.infer<typeof SaveProductDraftSchema>;
export type UpdateProductDraft = z.infer<typeof UpdateProductDraftSchema>;
export type PublishProduct = z.infer<typeof PublishProductSchema>;
export type ProductDraft = z.infer<typeof ProductDraftSchema>;
export type UpdateProductStatus = z.infer<typeof UpdateProductStatusSchema>;
