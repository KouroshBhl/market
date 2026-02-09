/**
 * Mock seller state for UI preview
 * Allows toggling between different tier states to test UI behavior
 */

export type TierLevel = 0 | 1 | 2;

export type BondStatus = 'LOCKED' | 'RELEASED' | 'SLASHED';

export interface SellerState {
  // Tier
  tier: TierLevel;

  // Bond
  hasBondPaid: boolean;
  bondAmount: number; // USDT
  bondStatus: BondStatus;
  bondSlashReason?: string; // Only if SLASHED

  // Order history
  successfulOrdersCount: number;
  daysSinceFirstPaidOrder: number;
  disputesOpenCount: number;

  // Payout settings
  payoutDelayHours: number;
  payoutDailyCap: number | 'Infinity'; // USDT or Infinity

  // Limits
  activeOffersLimit: number;
  activeOrdersLimit: number;

  // Current usage (for display)
  activeOffersCount: number;
  activeOrdersCount: number;
}

// Preset states for different tiers
export const TIER_0_STATE: SellerState = {
  tier: 0,
  hasBondPaid: false,
  bondAmount: 0,
  bondStatus: 'LOCKED',
  successfulOrdersCount: 0,
  daysSinceFirstPaidOrder: 0,
  disputesOpenCount: 0,
  payoutDelayHours: 72,
  payoutDailyCap: 100,
  activeOffersLimit: 1,
  activeOrdersLimit: 3,
  activeOffersCount: 0,
  activeOrdersCount: 0,
};

export const TIER_1_STATE: SellerState = {
  tier: 1,
  hasBondPaid: true,
  bondAmount: 25,
  bondStatus: 'LOCKED',
  successfulOrdersCount: 5,
  daysSinceFirstPaidOrder: 7,
  disputesOpenCount: 0,
  payoutDelayHours: 48,
  payoutDailyCap: 500,
  activeOffersLimit: 5,
  activeOrdersLimit: 10,
  activeOffersCount: 2,
  activeOrdersCount: 4,
};

export const TIER_2_STATE: SellerState = {
  tier: 2,
  hasBondPaid: true,
  bondAmount: 25,
  bondStatus: 'RELEASED',
  successfulOrdersCount: 25,
  daysSinceFirstPaidOrder: 20,
  disputesOpenCount: 0,
  payoutDelayHours: 24,
  payoutDailyCap: 'Infinity',
  activeOffersLimit: 999999,
  activeOrdersLimit: 999999,
  activeOffersCount: 8,
  activeOrdersCount: 15,
};

export const TIER_1_WITH_DISPUTE: SellerState = {
  ...TIER_1_STATE,
  disputesOpenCount: 1,
};

export const TIER_0_BOND_SLASHED: SellerState = {
  ...TIER_0_STATE,
  hasBondPaid: true,
  bondAmount: 25,
  bondStatus: 'SLASHED',
  bondSlashReason: 'Multiple buyer complaints for non-delivery',
};

export function getTierName(tier: TierLevel): string {
  switch (tier) {
    case 0:
      return 'Tier 0: New Seller';
    case 1:
      return 'Tier 1: Verified Seller';
    case 2:
      return 'Tier 2: Trusted Seller';
  }
}

export function getTierDescription(tier: TierLevel): string {
  switch (tier) {
    case 0:
      return 'Limited access, strict monitoring';
    case 1:
      return 'Bond paid, building reputation';
    case 2:
      return 'Fully unlocked, bond released';
  }
}

export function formatLimit(value: number | 'Infinity'): string {
  return value === 'Infinity' ? 'Unlimited' : String(value);
}

export function formatPayoutCap(value: number | 'Infinity'): string {
  return value === 'Infinity' ? 'Unlimited' : `$${value} USDT`;
}
