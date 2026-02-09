// ---------------------------------------------------------------------------
// Preview Presets — complete SellerState snapshots used by the preview banner.
// These are only visible when preview mode is active (?preview=1 or dev env).
// ---------------------------------------------------------------------------

import type { SellerState } from "./mockSellerState";

export type PresetKey =
  | "real"
  | "tier0_new"
  | "tier1_limited"
  | "tier1_dispute"
  | "tier1_slashed"
  | "tier2_trusted";

export interface PresetOption {
  key: PresetKey;
  label: string;
}

export const PRESET_OPTIONS: PresetOption[] = [
  { key: "real", label: "Real data" },
  { key: "tier0_new", label: "Tier 0 (new seller)" },
  { key: "tier1_limited", label: "Tier 1 (bond paid, limited)" },
  { key: "tier1_dispute", label: "Tier 1 (dispute open)" },
  { key: "tier1_slashed", label: "Tier 1 (bond slashed)" },
  { key: "tier2_trusted", label: "Tier 2 (trusted)" },
];

export const PREVIEW_PRESETS: Record<PresetKey, SellerState> = {
  // "Real data" — simulates a mid-journey Tier 1 seller (what the API would
  // return in production once real data fetching is wired up).
  real: {
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

  tier0_new: {
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

  tier1_limited: {
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

  tier1_dispute: {
    tier: 1,
    hasBondPaid: true,
    bondAmount: 25,
    bondStatus: "LOCKED",
    successfulOrdersCount: 6,
    daysSinceFirstPaidOrder: 9,
    disputesOpenCount: 2,
    payoutDelayHours: 48,
    payoutDailyCap: 200,
    activeOffersLimit: 5,
    activeOrdersLimit: 10,
    slashReason: "",
  },

  tier1_slashed: {
    tier: 1,
    hasBondPaid: true,
    bondAmount: 25,
    bondStatus: "SLASHED",
    successfulOrdersCount: 3,
    daysSinceFirstPaidOrder: 7,
    disputesOpenCount: 1,
    payoutDelayHours: 48,
    payoutDailyCap: 200,
    activeOffersLimit: 5,
    activeOrdersLimit: 10,
    slashReason:
      "Bond forfeited: multiple confirmed fraudulent deliveries reported by buyers.",
  },

  tier2_trusted: {
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
