import { z } from 'zod';
import type { ApiContract } from '../base';

/**
 * Child category schema
 */
const ChildCategorySchema = z.object({
  id: z.string().uuid().openapi({ example: '10000000-0000-0000-0000-000000000001' }),
  name: z.string().openapi({ example: 'World of Warcraft' }),
  slug: z.string().openapi({ example: 'world-of-warcraft' }),
  sortOrder: z.number().int().openapi({ example: 10 }),
}).openapi('ChildCategory');

/**
 * Parent category with children schema
 */
const ParentCategorySchema = z.object({
  id: z.string().uuid().openapi({ example: '00000000-0000-0000-0000-000000000001' }),
  name: z.string().openapi({ example: 'Games' }),
  slug: z.string().openapi({ example: 'games' }),
  sortOrder: z.number().int().openapi({ example: 10 }),
  children: z.array(ChildCategorySchema).openapi({
    description: 'Active child categories ordered by sortOrder',
  }),
}).openapi('ParentCategory');

/**
 * Response schema for GET /categories
 */
const GetCategoriesResponseSchema = z.object({
  parents: z.array(ParentCategorySchema).openapi({
    description: 'Active parent categories with their active children',
  }),
}).openapi('GetCategoriesResponse');

/**
 * Contract for GET /categories
 * Returns all active parent categories with their active children
 */
export const getCategoriesContract = {
  method: 'get',
  path: '/categories',
  tags: ['Categories'],
  summary: 'Get active categories',
  description: 'Returns all active parent categories with their active children, ordered by sortOrder. Used for two-step category selection in product creation.',
  
  responses: {
    200: {
      description: 'Successfully retrieved categories',
      schema: GetCategoriesResponseSchema,
    },
  },
} as const satisfies ApiContract;

export type GetCategoriesResponse = z.infer<typeof GetCategoriesResponseSchema>;
