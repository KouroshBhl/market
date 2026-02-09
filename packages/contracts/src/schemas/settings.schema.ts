import { z } from 'zod';

// ============================================
// PLATFORM SETTINGS (Single-row table)
// ============================================

// Platform fee configuration (extended with payment fee from gateway config)
export const PlatformFeeConfigSchema = z.object({
  platformFeeBps: z.number().int().min(0).max(5000), // 0-5000 bps (0%-50%)
  platformFeePercent: z.number(), // Computed: bps / 100
  paymentFeeBps: z.number().int().min(0), // Default gateway fee in bps (e.g. 1000 = 10%)
  paymentFeePercent: z.number(), // Computed: bps / 100
  updatedAt: z.string(),
}).openapi('PlatformFeeConfig');

export type PlatformFeeConfig = z.infer<typeof PlatformFeeConfigSchema>;

// PATCH /admin/settings/platform-fee - Update platform fee
export const UpdatePlatformFeeSchema = z.object({
  platformFeeBps: z.number().int().min(0).max(5000), // 0-5000 bps (0%-50%)
}).openapi('UpdatePlatformFee');

export type UpdatePlatformFee = z.infer<typeof UpdatePlatformFeeSchema>;

// Legacy commission calculation (kept for backward compat)
export const CommissionCalculationSchema = z.object({
  sellerPriceCents: z.number().int(),
  feeBps: z.number().int(),
  feeAmountCents: z.number().int(),
  buyerTotalCents: z.number().int(),
}).openapi('CommissionCalculation');

export type CommissionCalculation = z.infer<typeof CommissionCalculationSchema>;

// ============================================
// SELLER PRICING BREAKDOWN (Phase 1: list price model)
// ============================================

// Seller-side pricing breakdown:
//   list_price = what buyer sees and pays
//   commission = list_price * platformFeeBps / 10000
//   paymentFee = list_price * paymentFeeBps / 10000
//   sellerNet  = list_price - commission - paymentFee
export const SellerPricingBreakdownSchema = z.object({
  listPriceCents: z.number().int(),     // = offer.priceAmount (buyer-facing)
  platformFeeBps: z.number().int(),
  platformFeeCents: z.number().int(),   // deducted from seller
  paymentFeeBps: z.number().int(),
  paymentFeeCents: z.number().int(),    // deducted from seller
  sellerNetCents: z.number().int(),     // what seller actually receives
}).openapi('SellerPricingBreakdown');

export type SellerPricingBreakdown = z.infer<typeof SellerPricingBreakdownSchema>;
