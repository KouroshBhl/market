import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Base contract structure for all API endpoints
 * Enforces consistent pattern across the API
 */
export interface ApiContract<
  TParams extends z.ZodTypeAny = z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
  TBody extends z.ZodTypeAny = z.ZodTypeAny,
  TResponse extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /** HTTP method */
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  
  /** API path (e.g., /api/categories) */
  path: string;
  
  /** OpenAPI tags for grouping */
  tags?: string[];
  
  /** Endpoint summary */
  summary?: string;
  
  /** Endpoint description */
  description?: string;
  
  /** Request schemas */
  request?: {
    params?: TParams;
    query?: TQuery;
    body?: TBody;
  };
  
  /** Response schemas by status code */
  responses: {
    [statusCode: number]: {
      description: string;
      schema: TResponse;
    };
  };
}

/**
 * Common error response schema
 */
export const ErrorResponseSchema = z.object({
  statusCode: z.number().openapi({ example: 400 }),
  message: z.string().openapi({ example: 'Validation failed' }),
  error: z.string().optional().openapi({ example: 'Bad Request' }),
}).openapi('ErrorResponse');

/**
 * Common validation error response
 */
export const ValidationErrorResponseSchema = z.object({
  statusCode: z.number().openapi({ example: 400 }),
  message: z.string().openapi({ example: 'Validation failed' }),
  errors: z.array(z.object({
    path: z.string(),
    message: z.string(),
  })).openapi({ example: [{ path: 'email', message: 'Invalid email format' }] }),
}).openapi('ValidationErrorResponse');

/**
 * Type helper to extract request types from contract
 */
export type ContractRequest<T extends ApiContract> = {
  params: T['request'] extends { params: infer P } ? (P extends z.ZodTypeAny ? z.infer<P> : never) : never;
  query: T['request'] extends { query: infer Q } ? (Q extends z.ZodTypeAny ? z.infer<Q> : never) : never;
  body: T['request'] extends { body: infer B } ? (B extends z.ZodTypeAny ? z.infer<B> : never) : never;
};

/**
 * Type helper to extract response type from contract
 */
export type ContractResponse<T extends ApiContract, StatusCode extends number = 200> = 
  StatusCode extends keyof T['responses']
    ? T['responses'][StatusCode]['schema'] extends z.ZodTypeAny
      ? z.infer<T['responses'][StatusCode]['schema']>
      : never
    : never;
