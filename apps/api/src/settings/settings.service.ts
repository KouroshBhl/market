import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  PlatformFeeConfig,
  UpdatePlatformFee,
  CommissionCalculation,
} from '@workspace/contracts';

const SETTINGS_ID = 'platform-settings-singleton'; // Fixed ID for single-row pattern
const MAX_FEE_BPS = 5000; // 50% max fee

@Injectable()
export class SettingsService {
  /**
   * Get current platform fee configuration (single-row table)
   * Creates default settings if none exist
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

    return {
      platformFeeBps: settings.platformFeeBps,
      platformFeePercent: settings.platformFeeBps / 100,
      updatedAt: settings.updatedAt.toISOString(),
    };
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
      // Update the single row
      settings = await prisma.platformSettings.update({
        where: { id: existing.id },
        data: {
          platformFeeBps: data.platformFeeBps,
        },
      });
    } else {
      // Create if missing (should not happen after seed, but defensive)
      settings = await prisma.platformSettings.create({
        data: {
          id: SETTINGS_ID,
          platformFeeBps: data.platformFeeBps,
        },
      });
    }

    return {
      platformFeeBps: settings.platformFeeBps,
      platformFeePercent: settings.platformFeeBps / 100,
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  /**
   * Calculate commission for a given seller price
   * Uses integer math only to avoid floating point issues
   * 
   * @param sellerPriceCents - Seller's base price in cents
   * @param feeBps - Platform fee in basis points (e.g., 300 = 3%)
   * @returns Commission calculation with all amounts in cents
   */
  calculateCommission(
    sellerPriceCents: number,
    feeBps: number,
  ): CommissionCalculation {
    // Calculate fee amount: (sellerPrice * feeBps) / 10000
    // Using integer math to avoid floating point precision issues
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
