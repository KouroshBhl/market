/**
 * Seller Gateway API helpers — list and toggle payment gateways.
 */

import type {
  GetSellerGatewaysResponse,
  UpdateSellerGatewayResponse,
} from '@workspace/contracts';
import { authedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============================================
// Gateways
// ============================================

export async function getSellerGateways(
  sellerId: string,
): Promise<GetSellerGatewaysResponse> {
  const res = await authedFetch(`${API_URL}/seller/${sellerId}/gateways`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch gateways');
  }
  return res.json();
}

export async function updateSellerGateway(
  sellerId: string,
  gatewayId: string,
  isEnabled: boolean,
): Promise<UpdateSellerGatewayResponse> {
  const res = await authedFetch(
    `${API_URL}/seller/${sellerId}/gateways/${gatewayId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled }),
    },
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update gateway');
  }
  return res.json();
}
