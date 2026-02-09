import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  GatewayStatus,
  SellerGatewayItem,
  GetSellerGatewaysResponse,
  UpdateSellerGatewayResponse,
} from '@workspace/contracts';

@Injectable()
export class SellerGatewaysService {
  private readonly logger = new Logger(SellerGatewaysService.name);

  // ============================================
  // Effective Enabled Logic
  // ============================================

  /**
   * Compute effective enabled state for a single gateway + optional seller preference.
   *
   * Rules:
   *  1. If gateway.isEnabledGlobally == false => false
   *  2. If gateway.sellerCanToggle == false => gateway.defaultEnabledForNewSellers
   *  3. If seller preference exists => pref.isEnabled
   *  4. Otherwise => gateway.defaultEnabledForNewSellers
   */
  computeEffectiveEnabled(
    gateway: {
      isEnabledGlobally: boolean;
      sellerCanToggle: boolean;
      defaultEnabledForNewSellers: boolean;
    },
    sellerPreference: { isEnabled: boolean } | null,
  ): boolean {
    if (!gateway.isEnabledGlobally) return false;
    if (!gateway.sellerCanToggle) return gateway.defaultEnabledForNewSellers;
    if (sellerPreference) return sellerPreference.isEnabled;
    return gateway.defaultEnabledForNewSellers;
  }

  /**
   * Compute UI status for a gateway.
   */
  computeStatus(gateway: {
    isEnabledGlobally: boolean;
    sellerCanToggle: boolean;
  }): GatewayStatus {
    if (!gateway.isEnabledGlobally) return 'GLOBALLY_DISABLED';
    if (!gateway.sellerCanToggle) return 'ADMIN_LOCKED';
    return 'AVAILABLE';
  }

  /**
   * Map a gateway + preference into the SellerGatewayItem response shape.
   */
  private toGatewayItem(
    gateway: {
      id: string;
      name: string;
      provider: string;
      isEnabledGlobally: boolean;
      sellerCanToggle: boolean;
      defaultEnabledForNewSellers: boolean;
      sortOrder: number;
    },
    pref: { isEnabled: boolean } | null,
  ): SellerGatewayItem {
    return {
      gateway: {
        id: gateway.id,
        name: gateway.name,
        provider: gateway.provider,
        isEnabledGlobally: gateway.isEnabledGlobally,
        sellerCanToggle: gateway.sellerCanToggle,
        defaultEnabledForNewSellers: gateway.defaultEnabledForNewSellers,
        sortOrder: gateway.sortOrder,
      },
      sellerPreference: pref ? { isEnabled: pref.isEnabled } : null,
      effectiveEnabled: this.computeEffectiveEnabled(gateway, pref),
      status: this.computeStatus(gateway),
    };
  }

  // ============================================
  // GET /seller/:sellerId/gateways
  // ============================================

  async getSellerGateways(sellerId: string): Promise<GetSellerGatewaysResponse> {
    // Verify seller exists
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
    });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Get all gateways sorted by sort_order
    const gateways = await prisma.platformGateway.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Get seller's preferences
    const preferences = await prisma.sellerGatewayPreference.findMany({
      where: { sellerId },
    });

    const prefMap = new Map(
      preferences.map((p) => [p.gatewayId, { isEnabled: p.isEnabled }]),
    );

    const items: SellerGatewayItem[] = gateways.map((gw) =>
      this.toGatewayItem(gw, prefMap.get(gw.id) ?? null),
    );

    return { gateways: items };
  }

  // ============================================
  // PATCH /seller/:sellerId/gateways/:gatewayId
  // ============================================

  async updateSellerGateway(
    sellerId: string,
    gatewayId: string,
    isEnabled: boolean,
  ): Promise<UpdateSellerGatewayResponse> {
    // 1. Find the gateway
    const gateway = await prisma.platformGateway.findUnique({
      where: { id: gatewayId },
    });
    if (!gateway) {
      throw new NotFoundException('Gateway not found');
    }

    // 2. Check if globally disabled => 409
    if (!gateway.isEnabledGlobally) {
      throw new ConflictException(
        'This gateway is currently disabled by the platform and cannot be modified.',
      );
    }

    // 3. Check if admin-locked => 403
    if (!gateway.sellerCanToggle) {
      throw new ForbiddenException(
        'This gateway is managed by the platform and cannot be toggled by sellers.',
      );
    }

    // 4. If disabling, validate at-least-one rule BEFORE persisting
    if (!isEnabled) {
      await this.validateAtLeastOneEnabled(sellerId, gatewayId);
    }

    // 5. Upsert seller preference
    const pref = await prisma.sellerGatewayPreference.upsert({
      where: {
        sellerId_gatewayId: { sellerId, gatewayId },
      },
      create: {
        sellerId,
        gatewayId,
        isEnabled,
      },
      update: {
        isEnabled,
      },
    });

    this.logger.log(
      `Seller ${sellerId} set gateway ${gatewayId} to ${isEnabled ? 'enabled' : 'disabled'}`,
    );

    return {
      gateway: {
        id: gateway.id,
        name: gateway.name,
        provider: gateway.provider,
        isEnabledGlobally: gateway.isEnabledGlobally,
        sellerCanToggle: gateway.sellerCanToggle,
        defaultEnabledForNewSellers: gateway.defaultEnabledForNewSellers,
        sortOrder: gateway.sortOrder,
      },
      sellerPreference: { isEnabled: pref.isEnabled },
      effectiveEnabled: this.computeEffectiveEnabled(gateway, {
        isEnabled: pref.isEnabled,
      }),
      status: this.computeStatus(gateway),
    };
  }

  // ============================================
  // Last-Gateway Validation
  // ============================================

  /**
   * Validate that disabling gatewayId won't leave the seller with zero
   * effective-enabled gateways.
   *
   * We compute effective_enabled for ALL gateways, simulating the target
   * gateway as disabled. If count == 0 => throw ConflictException.
   */
  private async validateAtLeastOneEnabled(
    sellerId: string,
    gatewayIdToDisable: string,
  ): Promise<void> {
    const gateways = await prisma.platformGateway.findMany();
    const preferences = await prisma.sellerGatewayPreference.findMany({
      where: { sellerId },
    });

    const prefMap = new Map(
      preferences.map((p) => [p.gatewayId, { isEnabled: p.isEnabled }]),
    );

    let enabledCount = 0;

    for (const gw of gateways) {
      // Simulate disabling the target gateway
      const pref =
        gw.id === gatewayIdToDisable
          ? { isEnabled: false }
          : prefMap.get(gw.id) ?? null;

      if (this.computeEffectiveEnabled(gw, pref)) {
        enabledCount++;
      }
    }

    if (enabledCount === 0) {
      throw new ConflictException(
        'At least one payment method must remain enabled. You cannot disable the last active gateway.',
      );
    }
  }
}
