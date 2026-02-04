import { z } from 'zod';

// ============================================
// PLATFORM SETTINGS (Single-row table)
// ============================================

// Platform fee configuration
export const PlatformFeeConfigSchema = z.object({
  platformFeeBps: z.number().int().min(0).max(5000), // 0-5000 bps (0%-50%)
  platformFeePercent: z.number(), // Computed: bps / 100
  updatedAt: z.string(),
}).openapi('PlatformFeeConfig');

export type PlatformFeeConfig = z.infer<typeof PlatformFeeConfigSchema>;

// PATCH /admin/settings/platform-fee - Update platform fee
export const UpdatePlatformFeeSchema = z.object({
  platformFeeBps: z.number().int().min(0).max(5000), // 0-5000 bps (0%-50%)
}).openapi('UpdatePlatformFee');

export type UpdatePlatformFee = z.infer<typeof UpdatePlatformFeeSchema>;

// Helper for calculating commission
export const CommissionCalculationSchema = z.object({
  sellerPriceCents: z.number().int(),
  feeBps: z.number().int(),
  feeAmountCents: z.number().int(),
  buyerTotalCents: z.number().int(),
}).openapi('CommissionCalculation');

export type CommissionCalculation = z.infer<typeof CommissionCalculationSchema>;
