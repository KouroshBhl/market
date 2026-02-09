import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  PlatformFeeConfig,
  UpdatePlatformFee,
  CommissionCalculation,
  SellerPricingBreakdown,
} from '@workspace/contracts';

const SETTINGS_ID = 'platform-settings-singleton'; // Fixed ID for single-row pattern
const MAX_FEE_BPS = 5000; // 50% max fee

@Injectable()
export class SettingsService {
  /**
   * Get current platform fee configuration (single-row table)
   * Also includes the default payment gateway fee from the first enabled gateway.
   * Creates default settings if none exist.
   */
  async getPlatformSettings(): Promise<PlatformFeeConfig> {
    let settings = await prisma.platformSettings.findFirst();

    // Auto-create default settings if missing (defensive)
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          id: SETTINGS_ID,
          platformFeeBps: 300, // 3% default
        },
      });
    }

    // Look up the default payment gateway fee (first enabled gateway with a fee)
    const paymentFeeBps = await this.getDefaultPaymentFeeBps();

    return {
      platformFeeBps: settings.platformFeeBps,
      platformFeePercent: settings.platformFeeBps / 100,
      paymentFeeBps,
      paymentFeePercent: paymentFeeBps / 100,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  /**
   * Get the default payment gateway fee in basis points.
   * Reads from the first globally-enabled platform gateway's feePercent.
   * Returns 0 if no gateway configured or feePercent is null.
   */
  private async getDefaultPaymentFeeBps(): Promise<number> {
    const gateway = await prisma.platformGateway.findFirst({
      where: { isEnabledGlobally: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (!gateway || gateway.feePercent === null) {
      return 0;
    }

    // feePercent is Decimal(5,2) — e.g. 10.00 means 10%. Convert to bps: * 100
    return Math.round(Number(gateway.feePercent) * 100);
  }

  /**
   * Update platform fee (admin only)
   * Validates range: 0-5000 bps (0-50%)
   */
  async updatePlatformFeeBps(data: UpdatePlatformFee): Promise<PlatformFeeConfig> {
    // Validate range
    if (data.platformFeeBps < 0 || data.platformFeeBps > MAX_FEE_BPS) {
      throw new BadRequestException(
        `Platform fee must be between 0 and ${MAX_FEE_BPS} bps (0-${MAX_FEE_BPS / 100}%)`,
      );
    }

    // Get existing settings (single-row)
    const existing = await prisma.platformSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.platformSettings.update({
        where: { id: existing.id },
        data: { platformFeeBps: data.platformFeeBps },
      });
    } else {
      settings = await prisma.platformSettings.create({
        data: {
          id: SETTINGS_ID,
          platformFeeBps: data.platformFeeBps,
        },
      });
    }

    const paymentFeeBps = await this.getDefaultPaymentFeeBps();

    return {
      platformFeeBps: settings.platformFeeBps,
      platformFeePercent: settings.platformFeeBps / 100,
      paymentFeeBps,
      paymentFeePercent: paymentFeeBps / 100,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  // ============================================
  // PRICING COMPUTATIONS (single source of truth)
  // ============================================

  /**
   * Calculate seller pricing breakdown from a list price.
   *
   * Phase 1 semantics (Plati-style):
   *   list_price = what the buyer sees and pays (= offer.priceAmount)
   *   commission  = list_price * platformFeeBps / 10000
   *   paymentFee  = list_price * paymentFeeBps / 10000
   *   sellerNet   = list_price - commission - paymentFee
   *
   * All amounts in smallest currency unit (cents).
   * Uses integer math to avoid floating point issues.
   */
  calculateSellerBreakdown(
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

  /**
   * Legacy: Calculate commission (old buyer-pays-more model).
   * Kept for backward compatibility with existing order snapshots.
   */
  calculateCommission(
    sellerPriceCents: number,
    feeBps: number,
  ): CommissionCalculation {
    const feeAmountCents = Math.round((sellerPriceCents * feeBps) / 10000);
    const buyerTotalCents = sellerPriceCents + feeAmountCents;

    return {
      sellerPriceCents,
      feeBps,
      feeAmountCents,
      buyerTotalCents,
    };
  }
}
