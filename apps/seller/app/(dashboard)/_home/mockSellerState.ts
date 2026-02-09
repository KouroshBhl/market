// ---------------------------------------------------------------------------
// Mock Seller State — used exclusively for previewing the Seller Overview
// Dashboard across different tier / bond / dispute configurations.
// ---------------------------------------------------------------------------

export type BondStatus = "LOCKED" | "RELEASED" | "SLASHED";

export interface SellerState {
  /** 0 = Unverified, 1 = Bonded, 2 = Trusted */
  tier: 0 | 1 | 2;

  /** Whether the seller has paid the bond */
  hasBondPaid: boolean;

  /** Bond amount in USDT */
  bondAmount: number;

  /** Current bond status */
  bondStatus: BondStatus;

  /** Number of successful orders completed */
  successfulOrdersCount: number;

  /** Days since the seller's first paid order */
  daysSinceFirstPaidOrder: number;

  /** Number of currently open disputes */
  disputesOpenCount: number;

  /** Payout hold delay in hours */
  payoutDelayHours: number;

  /** Daily payout cap in USDT (Infinity = unlimited) */
  payoutDailyCap: number;

  /** Max active offers the seller can maintain */
  activeOffersLimit: number;

  /** Max active orders the seller can handle concurrently */
  activeOrdersLimit: number;

  /** Reason string shown when bond is slashed (mock) */
  slashReason: string;
}

// ---------------------------------------------------------------------------
// Tier Presets
// ---------------------------------------------------------------------------

export const TIER_PRESETS: Record<0 | 1 | 2, SellerState> = {
  0: {
    tier: 0,
    hasBondPaid: false,
    bondAmount: 25,
    bondStatus: "LOCKED",
    successfulOrdersCount: 0,
    daysSinceFirstPaidOrder: 0,
    disputesOpenCount: 0,
    payoutDelayHours: 72,
    payoutDailyCap: 50,
    activeOffersLimit: 1,
    activeOrdersLimit: 2,
    slashReason: "",
  },
  1: {
    tier: 1,
    hasBondPaid: true,
    bondAmount: 25,
    bondStatus: "LOCKED",
    successfulOrdersCount: 4,
    daysSinceFirstPaidOrder: 5,
    disputesOpenCount: 0,
    payoutDelayHours: 48,
    payoutDailyCap: 200,
    activeOffersLimit: 5,
    activeOrdersLimit: 10,
    slashReason: "",
  },
  2: {
    tier: 2,
    hasBondPaid: true,
    bondAmount: 25,
    bondStatus: "RELEASED",
    successfulOrdersCount: 15,
    daysSinceFirstPaidOrder: 20,
    disputesOpenCount: 0,
    payoutDelayHours: 24,
    payoutDailyCap: Infinity,
    activeOffersLimit: Infinity,
    activeOrdersLimit: Infinity,
    slashReason: "",
  },
};

// ---------------------------------------------------------------------------
// Tier display helpers
// ---------------------------------------------------------------------------

export const TIER_META: Record<
  0 | 1 | 2,
  { name: string; label: string; badgeVariant: "secondary" | "warning" | "success"; description: string }
> = {
  0: {
    name: "Tier 0",
    label: "New Seller",
    badgeVariant: "secondary",
    description: "Limited access — pay the bond or publish your first offer to get started.",
  },
  1: {
    name: "Tier 1",
    label: "Bonded Seller",
    badgeVariant: "warning",
    description: "Bond paid — complete orders to unlock full limits.",
  },
  2: {
    name: "Tier 2",
    label: "Trusted Seller",
    badgeVariant: "success",
    description: "Full access — no limits, fastest payouts.",
  },
};
