import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { CurrencySchema } from './currency.schema';

extendZodWithOpenApi(z);

export const ProductSchema = z.object({
  id: z.string().uuid(),
  status: z.string().optional(),
  deliveryType: z.enum(['AUTO_KEY', 'MANUAL']).optional(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  basePrice: z.number().int().nullable(),
  baseCurrency: CurrencySchema.nullable(),
  displayCurrency: CurrencySchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Product');

export const CreateProductSchema = z.object({
  deliveryType: z.enum(['AUTO_KEY', 'MANUAL']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  basePrice: z.number().int().nonnegative('Price must be non-negative'),
  baseCurrency: CurrencySchema,
  displayCurrency: CurrencySchema,
}).openapi('CreateProduct');

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
