import { z } from 'zod';
import type { ApiContract } from '../base';

const CategoryInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  parent: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  }).nullable(),
}).openapi('CategoryInfo');

const VariantSummarySchema = z.object({
  id: z.string().uuid(),
  region: z.enum(['EU', 'US', 'TR', 'GLOBAL']),
  durationDays: z.number().int().nullable(),
  edition: z.string().nullable(),
  sku: z.string(),
  supportsAutoKey: z.boolean(),
  supportsManual: z.boolean(),
  sortOrder: z.number().int(),
  offerCount: z.number().int().openapi({ description: 'Number of active offers for this variant' }),
}).openapi('VariantSummary');

const ProductBySlugResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  category: CategoryInfoSchema,
  variants: z.array(VariantSummarySchema),
}).openapi('ProductBySlugResponse');

export const getProductBySlugContract = {
  method: 'get',
  path: '/catalog/products/by-slug/:slug',
  tags: ['Catalog'],
  summary: 'Get catalog product by slug',
  description: 'Returns a single active catalog product by its slug, including category info and active variants. Used by the buyer product page.',

  request: {
    params: z.object({
      slug: z.string().openapi({ example: 'world-of-warcraft-game-time' }),
    }),
  },

  responses: {
    200: {
      description: 'Product found',
      schema: ProductBySlugResponseSchema,
    },
    404: {
      description: 'Product not found or inactive',
      schema: z.object({
        statusCode: z.number(),
        message: z.string(),
      }),
    },
  },
} as const satisfies ApiContract;

export type ProductBySlugResponse = z.infer<typeof ProductBySlugResponseSchema>;
export type VariantSummary = z.infer<typeof VariantSummarySchema>;
export type CategoryInfo = z.infer<typeof CategoryInfoSchema>;
