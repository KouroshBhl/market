/**
 * Central Contract Registry
 * 
 * ALL API contracts MUST be exported from this file.
 * This is the single source of truth for OpenAPI generation.
 * 
 * When adding a new endpoint:
 * 1. Create a contract file in the appropriate folder
 * 2. Export it from this registry
 * 3. The OpenAPI spec will update automatically
 */

// Categories
export { getCategoriesContract } from './categories/get-categories.contract';

// Products
export { createProductContract } from './products/create-product.contract';

// Add new contracts here as you create them
// Example:
// export { getUsersContract } from './users/get-users.contract';
// export { updateUserContract } from './users/update-user.contract';

/**
 * List of all contracts for OpenAPI generation
 * This array is used by the OpenAPI generator to build the spec
 */
import { getCategoriesContract } from './categories/get-categories.contract';
import { createProductContract } from './products/create-product.contract';
import type { ApiContract } from './base';

export const ALL_CONTRACTS: ReadonlyArray<ApiContract> = [
  getCategoriesContract,
  createProductContract,
] as const;
