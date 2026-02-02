import { z } from 'zod';

// ============================================
// CATALOG - Read-only marketplace catalog
// ============================================

export const RegionSchema = z.enum(['EU', 'US', 'TR', 'GLOBAL']);
export type Region = z.infer<typeof RegionSchema>;

// Catalog Product (marketplace product page)
export const CatalogProductSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CatalogProduct = z.infer<typeof CatalogProductSchema>;

// Catalog Variant (region/duration/edition)
export const CatalogVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  region: RegionSchema,
  durationDays: z.number().nullable(),
  edition: z.string().nullable(),
  sku: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CatalogVariant = z.infer<typeof CatalogVariantSchema>;

// Variant with product info (for listings)
export const CatalogVariantWithProductSchema = CatalogVariantSchema.extend({
  product: CatalogProductSchema,
});

export type CatalogVariantWithProduct = z.infer<typeof CatalogVariantWithProductSchema>;

// GET /catalog/products query params
export const GetCatalogProductsQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
});

export type GetCatalogProductsQuery = z.infer<typeof GetCatalogProductsQuerySchema>;

// GET /catalog/products response
export const GetCatalogProductsResponseSchema = z.object({
  products: z.array(CatalogProductSchema),
});

export type GetCatalogProductsResponse = z.infer<typeof GetCatalogProductsResponseSchema>;

// GET /catalog/products/:productId/variants response
export const GetCatalogVariantsResponseSchema = z.object({
  variants: z.array(CatalogVariantSchema),
});

export type GetCatalogVariantsResponse = z.infer<typeof GetCatalogVariantsResponseSchema>;
