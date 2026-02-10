/**
 * Central Contract Registry
 * 
 * ALL API contracts MUST be exported from this file.
 * This is the single source of truth for OpenAPI generation.
 */

// Categories
export { getCategoriesContract } from './categories/get-categories.contract';

// Catalog
export { createProductContract } from './products/create-product.contract';
export { getProductBySlugContract } from './catalog/get-product-by-slug.contract';

// Public Offers
export { getPublicOffersByVariantContract } from './offers/get-public-offers.contract';

/**
 * List of all contracts for OpenAPI generation
 */
import { getCategoriesContract } from './categories/get-categories.contract';
import { createProductContract } from './products/create-product.contract';
import { getProductBySlugContract } from './catalog/get-product-by-slug.contract';
import { getPublicOffersByVariantContract } from './offers/get-public-offers.contract';
import type { ApiContract } from './base';

export const ALL_CONTRACTS: ReadonlyArray<ApiContract> = [
  getCategoriesContract,
  createProductContract,
  getProductBySlugContract,
  getPublicOffersByVariantContract,
] as const;
