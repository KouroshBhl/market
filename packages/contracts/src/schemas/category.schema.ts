import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

/**
 * Base category schema
 */
export const CategorySchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Category');

/**
 * Parent category with children
 */
export const ParentCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  sortOrder: z.number().int(),
  children: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    sortOrder: z.number().int(),
  })),
}).openapi('ParentCategory');

/**
 * Child category (for display in product forms)
 */
export const ChildCategorySchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  sortOrder: z.number().int(),
  parentName: z.string().optional(),
}).openapi('ChildCategory');

/**
 * Response for fetching active categories grouped by parent
 */
export const CategoriesResponseSchema = z.object({
  parents: z.array(ParentCategorySchema),
}).openapi('CategoriesResponse');

/**
 * Type exports
 */
export type Category = z.infer<typeof CategorySchema>;
export type ParentCategory = z.infer<typeof ParentCategorySchema>;
export type ChildCategory = z.infer<typeof ChildCategorySchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
