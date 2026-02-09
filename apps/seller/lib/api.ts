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

// SELLER_ID is no longer hardcoded — it comes from the auth user's seller profile.
// For endpoints that still need sellerId as a query param, we get it from the auth context.
// But as we migrate endpoints to use Bearer auth, this becomes unnecessary.
export const SELLER_ID = '00000000-0000-0000-0000-000000000001'; // Legacy fallback

export async function getProducts(): Promise<OfferWithDetails[]> {
  const response = await authedFetch(`${API_URL}/seller/offers?sellerId=${SELLER_ID}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch offers');
  }

  const data = await response.json();
  return data.offers; // API returns { offers: [...] }
}

export async function getOffer(offerId: string): Promise<OfferWithDetails | null> {
  const offers = await getProducts();
  return offers.find((o) => o.id === offerId) ?? null;
}

export async function updateOfferStatus(
  offerId: string,
  payload: UpdateOfferStatus
): Promise<void> {
  const response = await authedFetch(`${API_URL}/offers/${offerId}/status`, {
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
  payload: UpdateOffer
): Promise<void> {
  const response = await authedFetch(`${API_URL}/offers/${offerId}`, {
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
  payload: { priceAmount: number; currency: string }
): Promise<void> {
  return updateOffer(offerId, payload);
}

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
  offerId: string
): Promise<KeyPoolWithCounts | null> {
  const response = await authedFetch(
    `${API_URL}/key-pools/by-offer/${offerId}?sellerId=${SELLER_ID}`
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch key pool');
  }
  return response.json();
}

export async function createKeyPool(offerId: string): Promise<KeyPoolWithCounts> {
  const response = await authedFetch(`${API_URL}/key-pools?sellerId=${SELLER_ID}`, {
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

export async function getKeyPoolStats(poolId: string): Promise<KeyPoolStats> {
  const response = await authedFetch(
    `${API_URL}/key-pools/${poolId}/stats?sellerId=${SELLER_ID}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch key pool stats');
  }
  return response.json();
}

export async function listKeys(
  poolId: string,
  options: { status?: string; page?: number; pageSize?: number } = {}
): Promise<ListKeysResponse> {
  const params = new URLSearchParams({ sellerId: SELLER_ID });
  if (options.status) params.set('status', options.status);
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));

  const response = await authedFetch(
    `${API_URL}/key-pools/${poolId}/keys?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch keys');
  }
  return response.json();
}

export async function uploadKeys(
  poolId: string,
  payload: { keys?: string[]; rawText?: string }
): Promise<UploadKeysResponse> {
  const response = await authedFetch(
    `${API_URL}/key-pools/${poolId}/keys/upload?sellerId=${SELLER_ID}`,
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
  newCode: string
): Promise<EditKeyResponse> {
  const response = await authedFetch(
    `${API_URL}/key-pools/${poolId}/keys/${keyId}?sellerId=${SELLER_ID}`,
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
  keyId: string
): Promise<InvalidateKeyResponse> {
  const response = await authedFetch(
    `${API_URL}/key-pools/${poolId}/keys/${keyId}?sellerId=${SELLER_ID}`,
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
  keyId: string
): Promise<RevealKeyResponse> {
  const response = await authedFetch(
    `${API_URL}/key-pools/${poolId}/keys/${keyId}/reveal?sellerId=${SELLER_ID}`,
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
