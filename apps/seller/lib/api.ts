import type {
  Product,
  SaveProductDraft,
  ProductDraft,
  OfferWithDetails,
  UpdateOfferStatus,
  KeyPoolWithCounts,
  KeyPoolStats,
  ListKeysResponse,
  UploadKeysResponse,
  EditKeyResponse,
  RevealKeyResponse,
  InvalidateKeyResponse,
} from '@workspace/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const SELLER_ID = '00000000-0000-0000-0000-000000000001'; // Hardcoded for MVP

export async function getProducts(): Promise<OfferWithDetails[]> {
  const response = await fetch(`${API_URL}/seller/offers?sellerId=${SELLER_ID}`, {
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
  const response = await fetch(`${API_URL}/offers/${offerId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? 'Failed to update offer status');
  }
}

export async function updateOfferPricing(
  offerId: string,
  payload: { priceAmount: number; currency: string }
): Promise<void> {
  const response = await fetch(`${API_URL}/offers/${offerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? 'Failed to update pricing');
  }
}

export async function saveProductDraft(data: SaveProductDraft): Promise<ProductDraft> {
  const response = await fetch(`${API_URL}/products/draft`, {
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
  const response = await fetch(`${API_URL}/products/${id}/publish`, {
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
  const response = await fetch(
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
  const response = await fetch(`${API_URL}/key-pools?sellerId=${SELLER_ID}`, {
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
  const response = await fetch(
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

  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
    `${API_URL}/key-pools/${poolId}/keys/${keyId}/reveal?sellerId=${SELLER_ID}`,
    { method: 'POST' }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reveal key');
  }
  return response.json();
}
