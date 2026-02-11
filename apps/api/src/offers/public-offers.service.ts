import { Injectable } from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  GetPublicOffersByVariantResponse,
  PublicOffer,
} from '../contracts/offers/get-public-offers.contract';

@Injectable()
export class PublicOffersService {
  /**
   * Get all active offers for a variant, enriched with seller display names
   * and stock availability. Used by the buyer product page.
   *
   * Single query with join — no N+1.
   */
  async getOffersByVariant(
    variantId: string,
  ): Promise<GetPublicOffersByVariantResponse> {
    // Get platform fee so the frontend can compute buyer total
    const settings = await prisma.platformSettings.findFirst();
    const platformFeeBps = settings?.platformFeeBps ?? 300;

    const offers = await prisma.offer.findMany({
      where: {
        variantId,
        status: 'active',
      },
      include: {
        keyPool: {
          include: {
            keys: {
              where: { status: 'AVAILABLE' },
              select: { id: true },
            },
          },
        },
      },
      orderBy: [{ priceAmount: 'asc' }, { publishedAt: 'asc' }],
    });

    // Gather unique sellerIds and fetch store slugs in one query
    const sellerIds = [...new Set(offers.map((o) => o.sellerId))];
    const sellerProfiles = await prisma.sellerProfile.findMany({
      where: { userId: { in: sellerIds } },
      select: { userId: true, slug: true },
    });
    const sellerSlugMap = new Map(
      sellerProfiles.map((p) => [p.userId, p.slug]),
    );

    const mapped: PublicOffer[] = offers.map((offer) => {
      const isAutoKey = offer.deliveryType === 'AUTO_KEY';
      const availableKeys = isAutoKey
        ? offer.keyPool?.keys?.length ?? 0
        : null;

      let inStock: boolean;
      if (isAutoKey) {
        inStock = (availableKeys ?? 0) > 0;
      } else {
        // MANUAL: consider in stock if stockCount is null (unlimited) or > 0
        inStock = offer.stockCount === null || offer.stockCount > 0;
      }

      return {
        id: offer.id,
        sellerId: offer.sellerId,
        sellerSlug:
          sellerSlugMap.get(offer.sellerId) ?? `seller-${offer.sellerId.slice(0, 6)}`,
        deliveryType: offer.deliveryType as 'AUTO_KEY' | 'MANUAL',
        priceAmountCents: offer.priceAmount,
        currency: offer.currency,
        estimatedDeliveryMinutes: offer.estimatedDeliveryMinutes,
        inStock,
        publishedAt: offer.publishedAt?.toISOString() ?? null,
      };
    });

    return { offers: mapped, platformFeeBps };
  }
}
