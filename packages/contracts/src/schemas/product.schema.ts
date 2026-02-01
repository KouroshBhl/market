import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { CurrencySchema } from './currency.schema';

extendZodWithOpenApi(z);

export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  basePrice: z.number().int(),
  baseCurrency: CurrencySchema,
  displayCurrency: CurrencySchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Product');

export const CreateProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  basePrice: z.number().int().nonnegative('Price must be non-negative'),
  baseCurrency: CurrencySchema,
  displayCurrency: CurrencySchema,
}).openapi('CreateProduct');

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
