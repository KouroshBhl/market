import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { CurrencySchema } from './currency.schema';
import { DeliveryTypeSchema } from './delivery-type.schema';

extendZodWithOpenApi(z);

export const ProductStatusSchema = z.enum(['draft', 'active', 'inactive']).openapi('ProductStatus');

export const ProductSchema = z.object({
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
}).openapi('Product');

export const AutoKeyConfigSchema = z.object({
  keyPoolId: z.string().uuid().nullable(),
  autoDelivery: z.boolean(),
  stockAlert: z.number().int().positive().nullable(),
}).openapi('AutoKeyConfig');

export const ManualDeliveryConfigSchema = z.object({
  deliveryInstructions: z.string().max(5000).nullable(),
  estimatedDeliverySLA: z.number().int().positive().nullable(), // in hours
}).openapi('ManualDeliveryConfig');

export type Product = z.infer<typeof ProductSchema>;
export type ProductStatus = z.infer<typeof ProductStatusSchema>;
export type AutoKeyConfig = z.infer<typeof AutoKeyConfigSchema>;
export type ManualDeliveryConfig = z.infer<typeof ManualDeliveryConfigSchema>;
