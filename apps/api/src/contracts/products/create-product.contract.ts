import { z } from 'zod';
import type { ApiContract } from '../base';
import { ErrorResponseSchema, ValidationErrorResponseSchema } from '../base';

/**
 * Delivery type enum
 */
const DeliveryTypeSchema = z.enum(['AUTO_KEY', 'MANUAL']).openapi({
  description: 'Type of product delivery',
  example: 'AUTO_KEY',
});

/**
 * Product status enum
 */
const ProductStatusSchema = z.enum(['DRAFT', 'PUBLISHED']).openapi({
  description: 'Product status',
  example: 'DRAFT',
});

/**
 * Currency enum
 */
const CurrencySchema = z.enum(['USD', 'EUR', 'UAH', 'RUB', 'IRR']).openapi({
  description: 'Currency code',
  example: 'USD',
});

/**
 * Request schema for POST /products
 */
const CreateProductRequestSchema = z.object({
  deliveryType: DeliveryTypeSchema,
  status: ProductStatusSchema.default('DRAFT').openapi({
    description: 'Product status - defaults to DRAFT if not provided',
  }),
  categoryId: z.string().uuid().optional().openapi({
    description: 'Category ID (must be a child category, not parent)',
    example: '10000000-0000-0000-0000-000000000001',
  }),
  title: z.string().min(1).max(200).optional().openapi({
    description: 'Product title',
    example: 'World of Warcraft Gold - 1000g',
  }),
  description: z.string().max(5000).optional().openapi({
    description: 'Product description',
    example: 'Fast and secure delivery of WoW gold',
  }),
  basePrice: z.number().int().positive().optional().openapi({
    description: 'Price in smallest currency unit (cents)',
    example: 9999,
  }),
  baseCurrency: CurrencySchema.optional(),
  displayCurrency: CurrencySchema.optional(),
}).openapi('CreateProductRequest');

/**
 * Response schema for POST /products
 */
const CreateProductResponseSchema = z.object({
  id: z.string().uuid().openapi({ example: 'a0000000-0000-0000-0000-000000000001' }),
  status: ProductStatusSchema,
  deliveryType: DeliveryTypeSchema,
  categoryId: z.string().uuid().nullable().openapi({ example: null }),
  title: z.string().nullable().openapi({ example: null }),
  description: z.string().nullable().openapi({ example: null }),
  basePrice: z.number().int().nullable().openapi({ example: null }),
  baseCurrency: CurrencySchema.nullable().openapi({ example: null }),
  displayCurrency: CurrencySchema.nullable().openapi({ example: null }),
  createdAt: z.string().datetime().openapi({
    example: '2024-01-01T00:00:00Z',
  }),
  updatedAt: z.string().datetime().openapi({
    example: '2024-01-01T00:00:00Z',
  }),
}).openapi('CreateProductResponse');

/**
 * Contract for POST /products
 * Creates a new product (draft or published)
 */
export const createProductContract = {
  method: 'post',
  path: '/products',
  tags: ['Products'],
  summary: 'Create a product',
  description: 'Creates a new product. Can be created as DRAFT (default) or PUBLISHED. For DRAFT, only deliveryType is required. For PUBLISHED, all fields must be provided and valid.',
  
  request: {
    body: CreateProductRequestSchema,
  },
  
  responses: {
    201: {
      description: 'Product created successfully',
      schema: CreateProductResponseSchema,
    },
    400: {
      description: 'Validation error',
      schema: ValidationErrorResponseSchema,
    },
    500: {
      description: 'Internal server error',
      schema: ErrorResponseSchema,
    },
  },
} as const satisfies ApiContract;

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>;
