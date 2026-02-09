import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import type {
  Offer,
  OfferWithDetails,
  SaveOfferDraft,
  PublishOffer,
  UpdateOffer,
  UpdateOfferStatus,
  GetSellerOffersResponse,
  AvailabilityStatus,
} from '@workspace/contracts';
import { CatalogService } from '../catalog/catalog.service';
import { KeyPoolsService } from '../key-pools/key-pools.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class OffersService {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly keyPoolsService: KeyPoolsService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get all offers for a seller (with availability info for AUTO_KEY offers)
   */
  async getSellerOffers(sellerId: string): Promise<GetSellerOffersResponse> {
    const offers = await prisma.offer.findMany({
      where: { sellerId },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        keyPool: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get platform fee for buyer price calculation
    const platformSettings = await this.settingsService.getPlatformSettings();

    // Enrich offers with availability info and computed buyer price
    const enrichedOffers = await Promise.all(
      offers.map(async (offer) => {
        let autoKeyAvailableCount: number | undefined;
        let availability: AvailabilityStatus | undefined;

        if (offer.deliveryType === 'AUTO_KEY' && offer.keyPool) {
          const { availableCount, availability: avail } = 
            await this.keyPoolsService.getOfferAvailability(offer.id);
          autoKeyAvailableCount = availableCount;
          availability = avail;
        }

        return this.mapOfferWithDetailsToContract(
          offer, 
          autoKeyAvailableCount, 
          availability,
          platformSettings.platformFeeBps
        );
      }),
    );

    return { offers: enrichedOffers };
  }

  /**
   * Get a single offer by ID
   */
  async getOfferById(id: string): Promise<OfferWithDetails> {
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        keyPool: true,
      },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    // Get platform fee for buyer price calculation
    const platformSettings = await this.settingsService.getPlatformSettings();

    // Get availability for AUTO_KEY offers
    let autoKeyAvailableCount: number | undefined;
    let availability: AvailabilityStatus | undefined;

    if (offer.deliveryType === 'AUTO_KEY' && offer.keyPool) {
      const { availableCount, availability: avail } = 
        await this.keyPoolsService.getOfferAvailability(offer.id);
      autoKeyAvailableCount = availableCount;
      availability = avail;
    }

    return this.mapOfferWithDetailsToContract(
      offer, 
      autoKeyAvailableCount, 
      availability,
      platformSettings.platformFeeBps
    );
  }

  /**
   * Save or update an offer draft
   */
  async saveDraft(data: SaveOfferDraft): Promise<Offer> {
    // Validate delivery capabilities if variant and deliveryType are provided
    if (data.variantId && data.deliveryType) {
      await this.validateDeliveryCapability(data.variantId, data.deliveryType);
    }

    // If ID provided, update existing draft
    if (data.id) {
      return this.updateExistingDraft(data.id, data);
    }

    // For new drafts, deliveryType is required
    if (!data.deliveryType) {
      throw new BadRequestException('Delivery type is required');
    }

    // stockCount: only for MANUAL; ignore for AUTO_KEY
    const stockCount =
      data.deliveryType === 'MANUAL' && data.stockCount !== undefined
        ? data.stockCount
        : null;

    const offer = await prisma.offer.create({
      data: {
        sellerId: data.sellerId,
        variantId: data.variantId || '', // Temporary placeholder if not selected yet
        status: 'draft',
        deliveryType: data.deliveryType,
        priceAmount: data.priceAmount || 0,
        currency: data.currency || 'USD',
        stockCount,
        descriptionMarkdown: data.descriptionMarkdown ?? null,
        deliveryInstructions: data.deliveryInstructions || null,
        estimatedDeliveryMinutes: data.deliveryType === 'MANUAL' 
          ? data.estimatedDeliveryMinutes || null 
          : null,
        // keyPool is created when publishing, not when saving draft
      },
      include: { keyPool: true },
    });

    return this.mapOfferToContract(offer);
  }

  /**
   * Update an existing draft
   */
  private async updateExistingDraft(
    id: string,
    data: SaveOfferDraft,
  ): Promise<Offer> {
    const existing = await prisma.offer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft offers can be updated');
    }

    // Validate delivery capabilities if variant or deliveryType are being changed
    const finalVariantId = data.variantId !== undefined ? data.variantId : existing.variantId;
    const finalDeliveryType = data.deliveryType !== undefined ? data.deliveryType : existing.deliveryType;
    
    if (finalVariantId && finalDeliveryType) {
      await this.validateDeliveryCapability(finalVariantId, finalDeliveryType);
    }

    // stockCount: only for MANUAL; ignore for AUTO_KEY
    const stockCountUpdate =
      finalDeliveryType === 'MANUAL' && data.stockCount !== undefined
        ? { stockCount: data.stockCount }
        : finalDeliveryType === 'AUTO_KEY'
          ? { stockCount: null }
          : data.stockCount !== undefined
            ? { stockCount: data.stockCount }
            : {};

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...(data.variantId !== undefined && { variantId: data.variantId }),
        ...(data.deliveryType !== undefined && { deliveryType: data.deliveryType }),
        ...(data.priceAmount !== undefined && { priceAmount: data.priceAmount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...stockCountUpdate,
        ...(data.descriptionMarkdown !== undefined && { descriptionMarkdown: data.descriptionMarkdown }),
        ...(data.deliveryInstructions !== undefined && {
          deliveryInstructions: data.deliveryInstructions,
        }),
        ...(data.estimatedDeliveryMinutes !== undefined && {
          estimatedDeliveryMinutes: finalDeliveryType === 'MANUAL' 
            ? data.estimatedDeliveryMinutes 
            : null,
        }),
        // keyPool is created when publishing, not when updating draft
      },
      include: { keyPool: true },
    });

    return this.mapOfferToContract(offer);
  }

  /**
   * Publish an offer (validate and set status to active)
   */
  async publish(data: PublishOffer): Promise<Offer> {
    // Validate variant exists and is active
    const variant = await prisma.catalogVariant.findUnique({
      where: { id: data.variantId },
    });

    if (!variant || !variant.isActive) {
      throw new BadRequestException('Invalid or inactive variant');
    }

    // Validate delivery capabilities
    await this.validateDeliveryCapability(data.variantId, data.deliveryType);

    // Validate delivery type requirements
    if (data.deliveryType === 'MANUAL') {
      if (!data.deliveryInstructions || data.deliveryInstructions.trim() === '') {
        throw new BadRequestException(
          'Delivery instructions are required for manual delivery',
        );
      }
      if (!data.estimatedDeliveryMinutes || data.estimatedDeliveryMinutes <= 0) {
        throw new BadRequestException(
          'Estimated delivery time (SLA) is required for manual delivery',
        );
      }
    }

    // AUTO_KEY specific validation
    // Publishing decision: Option A - Allow publish even with 0 keys (shows OUT_OF_STOCK)
    // This is more flexible for sellers who want to set up offers before uploading keys
    // stockCount is NOT used for AUTO_KEY - availability is derived from key pool

    // Create offer with active status, and key pool if AUTO_KEY
    const offer = await prisma.$transaction(async (tx) => {
      // Create the offer
      const createdOffer = await tx.offer.create({
        data: {
          sellerId: data.sellerId,
          variantId: data.variantId,
          status: 'active',
          deliveryType: data.deliveryType,
          priceAmount: data.priceAmount,
          currency: data.currency,
          // stockCount only used for MANUAL delivery
          stockCount: data.deliveryType === 'MANUAL' && data.stockCount !== undefined 
            ? data.stockCount 
            : null,
          descriptionMarkdown: data.descriptionMarkdown ?? null,
          deliveryInstructions: data.deliveryInstructions || null,
          estimatedDeliveryMinutes: data.deliveryType === 'MANUAL' 
            ? data.estimatedDeliveryMinutes || null 
            : null,
          publishedAt: new Date(),
        },
      });

      // Auto-create key pool for AUTO_KEY offers
      if (data.deliveryType === 'AUTO_KEY') {
        await tx.keyPool.create({
          data: {
            offerId: createdOffer.id,
            sellerId: data.sellerId,
            isActive: true,
          },
        });
      }

      return createdOffer;
    });

    // Fetch the offer with keyPool for response
    const offerWithPool = await prisma.offer.findUnique({
      where: { id: offer.id },
      include: { keyPool: true },
    });

    return this.mapOfferToContract(offerWithPool!);
  }

  /**
   * Update offer (pricing, description, etc.) - for draft and active offers
   */
  async updateOffer(id: string, data: UpdateOffer): Promise<Offer> {
    const existing = await prisma.offer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    // Validate delivery-specific fields
    if (existing.deliveryType === 'MANUAL') {
      // If updating deliveryInstructions, ensure it's not empty for active offers
      if (data.deliveryInstructions !== undefined && existing.status === 'active') {
        if (data.deliveryInstructions === null || data.deliveryInstructions.trim() === '') {
          throw new BadRequestException(
            'Delivery instructions cannot be empty for active manual offers',
          );
        }
      }

      // If updating estimatedDeliveryMinutes, validate range
      if (data.estimatedDeliveryMinutes !== undefined) {
        if (data.estimatedDeliveryMinutes !== null) {
          if (data.estimatedDeliveryMinutes < 5 || data.estimatedDeliveryMinutes > 10080) {
            throw new BadRequestException(
              'Estimated delivery time must be between 5 and 10080 minutes (7 days)',
            );
          }
        } else if (existing.status === 'active') {
          throw new BadRequestException(
            'Estimated delivery time cannot be removed from active manual offers',
          );
        }
      }
    } else if (existing.deliveryType === 'AUTO_KEY') {
      // Prevent updating MANUAL-only fields for AUTO_KEY offers
      if (data.deliveryInstructions !== undefined && data.deliveryInstructions !== null) {
        throw new BadRequestException(
          'Delivery instructions are not applicable to auto-key offers',
        );
      }
      if (data.estimatedDeliveryMinutes !== undefined && data.estimatedDeliveryMinutes !== null) {
        throw new BadRequestException(
          'Estimated delivery time is not applicable to auto-key offers',
        );
      }
      if (data.stockCount !== undefined && data.stockCount !== null) {
        throw new BadRequestException(
          'Stock count is not applicable to auto-key offers (managed via key pool)',
        );
      }
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...(data.priceAmount !== undefined && { priceAmount: data.priceAmount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.descriptionMarkdown !== undefined && {
          descriptionMarkdown: data.descriptionMarkdown,
        }),
        ...(data.deliveryInstructions !== undefined && existing.deliveryType === 'MANUAL' && {
          deliveryInstructions: data.deliveryInstructions,
        }),
        ...(data.estimatedDeliveryMinutes !== undefined && existing.deliveryType === 'MANUAL' && {
          estimatedDeliveryMinutes: data.estimatedDeliveryMinutes,
        }),
        ...(data.stockCount !== undefined && existing.deliveryType === 'MANUAL' && {
          stockCount: data.stockCount,
        }),
      },
      include: { keyPool: true },
    });

    return this.mapOfferToContract(offer);
  }

  /**
   * Update offer status (toggle active <-> inactive)
   */
  async updateStatus(id: string, data: UpdateOfferStatus): Promise<Offer> {
    const existing = await prisma.offer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    if (existing.status === 'draft') {
      throw new BadRequestException(
        'Cannot change status of draft offers. Publish them first.',
      );
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: { status: data.status },
    });

    return this.mapOfferToContract(offer);
  }

  /**
   * Validate that the variant supports the selected delivery type
   */
  private async validateDeliveryCapability(
    variantId: string,
    deliveryType: string,
  ): Promise<void> {
    const variant = await prisma.catalogVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        supportsAutoKey: true,
        supportsManual: true,
        isActive: true,
        sku: true,
      },
    });

    if (!variant) {
      throw new BadRequestException(`Variant with ID ${variantId} not found`);
    }

    if (!variant.isActive) {
      throw new BadRequestException(
        `Variant ${variant.sku} is not active and cannot be used for offers`,
      );
    }

    if (deliveryType === 'AUTO_KEY' && !variant.supportsAutoKey) {
      throw new BadRequestException(
        `Variant ${variant.sku} does not support auto-key delivery`,
      );
    }

    if (deliveryType === 'MANUAL' && !variant.supportsManual) {
      throw new BadRequestException(
        `Variant ${variant.sku} does not support manual delivery`,
      );
    }

    // Ensure at least one delivery method is supported
    if (!variant.supportsAutoKey && !variant.supportsManual) {
      throw new BadRequestException(
        `Variant ${variant.sku} does not support any delivery method and cannot be used`,
      );
    }
  }

  /**
   * Helper: Map Prisma Offer to contract
   */
  private mapOfferToContract(offer: any): Offer {
    return {
      id: offer.id,
      sellerId: offer.sellerId,
      variantId: offer.variantId,
      status: offer.status,
      deliveryType: offer.deliveryType,
      priceAmount: offer.priceAmount,
      currency: offer.currency,
      stockCount: offer.deliveryType === 'AUTO_KEY' ? null : offer.stockCount,
      descriptionMarkdown: offer.descriptionMarkdown,
      deliveryInstructions: offer.deliveryInstructions,
      estimatedDeliveryMinutes: offer.estimatedDeliveryMinutes,
      keyPoolId: offer.keyPool?.id || null,
      publishedAt: offer.publishedAt?.toISOString() || null,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Map Prisma Offer with variant + product to contract
   */
  private mapOfferWithDetailsToContract(
    offer: any,
    autoKeyAvailableCount?: number,
    availability?: AvailabilityStatus,
    platformFeeBps?: number,
  ): OfferWithDetails {
    // Phase 1: buyer price = list price (fees absorbed by seller, not added on top)
    const buyerPriceAmount = offer.priceAmount > 0 ? offer.priceAmount : undefined;

    return {
      id: offer.id,
      sellerId: offer.sellerId,
      variantId: offer.variantId,
      status: offer.status,
      deliveryType: offer.deliveryType,
      priceAmount: offer.priceAmount,
      currency: offer.currency,
      stockCount: offer.deliveryType === 'AUTO_KEY' ? null : offer.stockCount,
      descriptionMarkdown: offer.descriptionMarkdown,
      deliveryInstructions: offer.deliveryInstructions,
      estimatedDeliveryMinutes: offer.estimatedDeliveryMinutes,
      keyPoolId: offer.keyPool?.id || null,
      publishedAt: offer.publishedAt?.toISOString() || null,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
      autoKeyAvailableCount,
      availability,
      buyerPriceAmount,
      variant: {
        id: offer.variant.id,
        productId: offer.variant.productId,
        region: offer.variant.region,
        durationDays: offer.variant.durationDays,
        edition: offer.variant.edition,
        sku: offer.variant.sku,
        supportsAutoKey: offer.variant.supportsAutoKey,
        supportsManual: offer.variant.supportsManual,
        isActive: offer.variant.isActive,
        sortOrder: offer.variant.sortOrder,
        createdAt: offer.variant.createdAt.toISOString(),
        updatedAt: offer.variant.updatedAt.toISOString(),
        product: {
          id: offer.variant.product.id,
          categoryId: offer.variant.product.categoryId,
          name: offer.variant.product.name,
          slug: offer.variant.product.slug,
          description: offer.variant.product.description,
          imageUrl: offer.variant.product.imageUrl,
          isActive: offer.variant.product.isActive,
          sortOrder: offer.variant.product.sortOrder,
          createdAt: offer.variant.product.createdAt.toISOString(),
          updatedAt: offer.variant.product.updatedAt.toISOString(),
        },
      },
    };
  }
}
