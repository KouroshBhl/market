/**
 * Seller API Client
 *
 * SECURITY FIX (2026-02-10): All API functions now require sellerId parameter
 * derived from the authenticated seller context (useSeller hook).
 *
 * Route pattern: /seller/:sellerId/... — sellerId is validated server-side
 * via SellerMemberGuard. The hardcoded SELLER_ID has been removed.
 */
import type {
  Product,
  SaveProductDraft,
  ProductDraft,
  OfferWithDetails,
  UpdateOffer,
  UpdateOfferStatus,
  KeyPoolWithCounts,
  KeyPoolStats,
  ListKeysResponse,
  UploadKeysResponse,
  EditKeyResponse,
  RevealKeyResponse,
  InvalidateKeyResponse,
  PlatformFeeConfig,
  SellerPricingBreakdown,
} from '@workspace/contracts';
import { authedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============================================
// OFFER API HELPERS
// ============================================

export async function getProducts(sellerId: string): Promise<OfferWithDetails[]> {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/offers`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch offers');
  }

  const data = await response.json();
  return data.offers;
}

export async function getOffer(offerId: string, sellerId: string): Promise<OfferWithDetails | null> {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/offers/${offerId}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch offer');
  }

  return response.json();
}

export async function updateOfferStatus(
  offerId: string,
  payload: UpdateOfferStatus,
  sellerId: string,
): Promise<void> {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/offers/${offerId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? 'Failed to update offer status');
  }
}

export async function updateOffer(
  offerId: string,
  payload: UpdateOffer,
  sellerId: string,
): Promise<void> {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/offers/${offerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? 'Failed to update offer');
  }
}

/** @deprecated Use updateOffer instead */
export async function updateOfferPricing(
  offerId: string,
  payload: { priceAmount: number; currency: string },
  sellerId: string,
): Promise<void> {
  return updateOffer(offerId, payload, sellerId);
}

export async function saveOfferDraft(
  data: Record<string, unknown>,
  sellerId: string,
): Promise<unknown> {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/offers/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save draft');
  }

  return response.json();
}

export async function publishOffer(
  data: Record<string, unknown>,
  sellerId: string,
): Promise<unknown> {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/offers/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to publish offer');
  }

  return response.json();
}

// Legacy aliases (these are no longer needed but kept for compatibility)
export async function saveProductDraft(data: SaveProductDraft): Promise<ProductDraft> {
  const response = await authedFetch(`${API_URL}/products/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save product draft');
  }

  return response.json();
}

export async function publishProduct(id: string): Promise<Product> {
  const response = await authedFetch(`${API_URL}/products/${id}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to publish product');
  }

  return response.json();
}

// ============================================
// KEY POOL API HELPERS
// ============================================

export async function getKeyPoolByOffer(
  offerId: string,
  sellerId: string,
): Promise<KeyPoolWithCounts | null> {
  const response = await authedFetch(
    `${API_URL}/seller/${sellerId}/key-pools/by-offer/${offerId}`
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch key pool');
  }
  return response.json();
}

export async function createKeyPool(offerId: string, sellerId: string): Promise<KeyPoolWithCounts> {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/key-pools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offerId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create key pool');
  }
  return response.json();
}

export async function getKeyPoolStats(poolId: string, sellerId: string): Promise<KeyPoolStats> {
  const response = await authedFetch(
    `${API_URL}/seller/${sellerId}/key-pools/${poolId}/stats`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch key pool stats');
  }
  return response.json();
}

export async function listKeys(
  poolId: string,
  sellerId: string,
  options: { status?: string; page?: number; pageSize?: number } = {}
): Promise<ListKeysResponse> {
  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));

  const qs = params.toString();
  const response = await authedFetch(
    `${API_URL}/seller/${sellerId}/key-pools/${poolId}/keys${qs ? `?${qs}` : ''}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch keys');
  }
  return response.json();
}

export async function uploadKeys(
  poolId: string,
  sellerId: string,
  payload: { keys?: string[]; rawText?: string }
): Promise<UploadKeysResponse> {
  const response = await authedFetch(
    `${API_URL}/seller/${sellerId}/key-pools/${poolId}/keys/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload keys');
  }
  return response.json();
}

export async function editKey(
  poolId: string,
  keyId: string,
  newCode: string,
  sellerId: string,
): Promise<EditKeyResponse> {
  const response = await authedFetch(
    `${API_URL}/seller/${sellerId}/key-pools/${poolId}/keys/${keyId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to edit key');
  }
  return response.json();
}

export async function invalidateKey(
  poolId: string,
  keyId: string,
  sellerId: string,
): Promise<InvalidateKeyResponse> {
  const response = await authedFetch(
    `${API_URL}/seller/${sellerId}/key-pools/${poolId}/keys/${keyId}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to invalidate key');
  }
  return response.json();
}

export async function revealKey(
  poolId: string,
  keyId: string,
  sellerId: string,
): Promise<RevealKeyResponse> {
  const response = await authedFetch(
    `${API_URL}/seller/${sellerId}/key-pools/${poolId}/keys/${keyId}/reveal`,
    { method: 'POST' }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reveal key');
  }
  return response.json();
}

// ============================================
// PLATFORM SETTINGS API HELPERS
// ============================================

export async function getPlatformFee(): Promise<PlatformFeeConfig> {
  const response = await fetch(`${API_URL}/settings/platform-fee`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch platform fee');
  }
  return response.json();
}

/**
 * Calculate seller pricing breakdown from a list price.
 *
 * Phase 1 semantics (Plati-style):
 *   list_price  = what the buyer sees and pays
 *   commission  = list_price * platformFeeBps / 10000
 *   paymentFee  = list_price * paymentFeeBps / 10000
 *   sellerNet   = list_price - commission - paymentFee
 *
 * Uses integer math to avoid floating point issues.
 * Must match backend SettingsService.calculateSellerBreakdown exactly.
 */
export function calculateSellerBreakdown(
  listPriceCents: number,
  platformFeeBps: number,
  paymentFeeBps: number,
): SellerPricingBreakdown {
  const platformFeeCents = Math.round((listPriceCents * platformFeeBps) / 10000);
  const paymentFeeCents = Math.round((listPriceCents * paymentFeeBps) / 10000);
  const sellerNetCents = listPriceCents - platformFeeCents - paymentFeeCents;

  return {
    listPriceCents,
    platformFeeBps,
    platformFeeCents,
    paymentFeeBps,
    paymentFeeCents,
    sellerNetCents,
  };
}

// ============================================
// STORE SETTINGS API HELPERS
// ============================================

export async function getStoreIdentity(sellerId: string) {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/settings/identity`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch store identity');
  }
  return response.json();
}

export async function updateStoreIdentity(
  sellerId: string,
  data: {
    sellerDisplayName?: string;
    logoUrl?: string | null;
    bio?: string | null;
    timezone?: string | null;
  }
) {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/settings/identity`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update store identity');
  }
  return response.json();
}

export async function changeStoreSlug(
  sellerId: string,
  newSlug: string
) {
  const response = await authedFetch(`${API_URL}/seller/${sellerId}/settings/identity/change-slug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newSlug }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change store URL');
  }
  return response.json();
}
