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
  UpdateOfferStatus,
  GetSellerOffersResponse,
} from '@workspace/contracts';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class OffersService {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Get all offers for a seller
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      offers: offers.map(this.mapOfferWithDetailsToContract),
    };
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
      },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    return this.mapOfferWithDetailsToContract(offer);
  }

  /**
   * Save or update an offer draft
   */
  async saveDraft(data: SaveOfferDraft): Promise<Offer> {
    // If ID provided, update existing draft
    if (data.id) {
      return this.updateExistingDraft(data.id, data);
    }

    // Otherwise create new draft
    const offer = await prisma.offer.create({
      data: {
        sellerId: data.sellerId,
        variantId: data.variantId || '', // Temporary placeholder if not selected yet
        status: 'draft',
        deliveryType: data.deliveryType,
        priceAmount: data.priceAmount || 0,
        currency: data.currency || 'USD',
        stockCount: data.stockCount !== undefined ? data.stockCount : null,
        deliveryInstructions: data.deliveryInstructions || null,
        keyPoolId: data.keyPoolId || null,
      },
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

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...(data.variantId !== undefined && { variantId: data.variantId }),
        ...(data.priceAmount !== undefined && { priceAmount: data.priceAmount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.stockCount !== undefined && { stockCount: data.stockCount }),
        ...(data.deliveryInstructions !== undefined && {
          deliveryInstructions: data.deliveryInstructions,
        }),
        ...(data.keyPoolId !== undefined && { keyPoolId: data.keyPoolId }),
      },
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

    // Validate delivery type requirements
    // Note: For MVP, these are optional since key pool system isn't implemented yet
    // TODO: Re-enable strict validation once key pool management is implemented
    
    // Soft validation - log warnings but don't block
    if (data.deliveryType === 'MANUAL' && !data.deliveryInstructions) {
      console.warn(
        `[WARN] Offer published without delivery instructions (seller: ${data.sellerId})`,
      );
    }

    if (data.deliveryType === 'AUTO_KEY' && !data.keyPoolId) {
      console.warn(
        `[WARN] Offer published without key pool ID (seller: ${data.sellerId})`,
      );
    }

    // Create offer with active status
    const offer = await prisma.offer.create({
      data: {
        sellerId: data.sellerId,
        variantId: data.variantId,
        status: 'active',
        deliveryType: data.deliveryType,
        priceAmount: data.priceAmount,
        currency: data.currency,
        stockCount: data.stockCount !== undefined ? data.stockCount : null,
        deliveryInstructions: data.deliveryInstructions || null,
        keyPoolId: data.keyPoolId || null,
        publishedAt: new Date(),
      },
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
      stockCount: offer.stockCount,
      deliveryInstructions: offer.deliveryInstructions,
      keyPoolId: offer.keyPoolId,
      publishedAt: offer.publishedAt?.toISOString() || null,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Map Prisma Offer with variant + product to contract
   */
  private mapOfferWithDetailsToContract(offer: any): OfferWithDetails {
    return {
      id: offer.id,
      sellerId: offer.sellerId,
      variantId: offer.variantId,
      status: offer.status,
      deliveryType: offer.deliveryType,
      priceAmount: offer.priceAmount,
      currency: offer.currency,
      stockCount: offer.stockCount,
      deliveryInstructions: offer.deliveryInstructions,
      keyPoolId: offer.keyPoolId,
      publishedAt: offer.publishedAt?.toISOString() || null,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
      variant: {
        id: offer.variant.id,
        productId: offer.variant.productId,
        region: offer.variant.region,
        durationDays: offer.variant.durationDays,
        edition: offer.variant.edition,
        sku: offer.variant.sku,
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
