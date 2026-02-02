import type { Product, SaveProductDraft, ProductDraft, OfferWithDetails } from '@workspace/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SELLER_ID = '00000000-0000-0000-0000-000000000001'; // Hardcoded for MVP

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
