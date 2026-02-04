import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import { KeyPoolsService } from '../key-pools/key-pools.service';
import { RequirementsService } from '../requirements/requirements.service';
import { CryptoService } from '../crypto/crypto.service';
import type {
  Order,
  PayOrderResponse,
  FulfillOrderResponse,
  GetOrderResponse,
  RequirementsPayload,
  GetSellerOrderResponse,
  GetSellerOrdersResponse,
  SellerOrder,
} from '@workspace/contracts';

@Injectable()
export class OrdersService {
  constructor(
    private readonly keyPoolsService: KeyPoolsService,
    private readonly requirementsService: RequirementsService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Create a new order (status: PENDING)
   */
  async createOrder(
    buyerId: string,
    offerId: string,
    requirementsPayload?: RequirementsPayload,
  ): Promise<Order> {
    // Verify offer exists and is active
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { keyPool: true },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    if (offer.status !== 'active') {
      throw new BadRequestException('Offer is not active');
    }

    // For AUTO_KEY offers, check availability
    if (offer.deliveryType === 'AUTO_KEY') {
      if (!offer.keyPool) {
        throw new BadRequestException('Offer has no key pool configured');
      }

      const { availability } = await this.keyPoolsService.getOfferAvailability(offerId);
      if (availability === 'out_of_stock') {
        throw new BadRequestException('Offer is out of stock');
      }
    }

    // Validate requirements payload against template
    const validation = await this.requirementsService.validateRequirementsPayload(
      offer.variantId,
      requirementsPayload,
    );

    if (!validation.valid) {
      throw new BadRequestException(
        `Requirements validation failed: ${validation.errors.join(', ')}`,
      );
    }

    // Separate sensitive fields for encryption
    let storedPayload: Record<string, unknown> | null = null;
    let encryptedPayload: string | null = null;

    if (requirementsPayload && Object.keys(requirementsPayload).length > 0) {
      const sensitiveData: Record<string, unknown> = {};
      const regularData: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(requirementsPayload)) {
        if (validation.sensitiveFields.includes(key)) {
          sensitiveData[key] = value;
        } else {
          regularData[key] = value;
        }
      }

      // Store non-sensitive data as JSON
      storedPayload = Object.keys(regularData).length > 0 ? regularData : null;

      // Encrypt sensitive data if any
      if (Object.keys(sensitiveData).length > 0) {
        encryptedPayload = this.cryptoService.encrypt(JSON.stringify(sensitiveData));
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        buyerId,
        offerId,
        status: 'PENDING',
        priceAmount: offer.priceAmount,
        currency: offer.currency,
        requirementsPayload: storedPayload,
        requirementsPayloadEncrypted: encryptedPayload,
      },
    });

    return this.mapOrderToContract(order);
  }

  /**
   * Simulate payment (MVP)
   * In production, this would be a webhook from payment provider
   */
  async payOrder(orderId: string): Promise<PayOrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot pay order with status ${order.status}. Only PENDING orders can be paid.`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    return {
      success: true,
      order: this.mapOrderToContract(updatedOrder),
    };
  }

  /**
   * Fulfill an order (deliver product/key)
   * MUST be idempotent: calling twice returns same result
   */
  async fulfillOrder(orderId: string): Promise<FulfillOrderResponse> {
    // Get order with offer details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        offer: {
          include: { keyPool: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Idempotency check: if already fulfilled, return existing result
    if (order.status === 'FULFILLED') {
      return this.getExistingFulfillmentResult(order);
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException(
        `Cannot fulfill order with status ${order.status}. Only PAID orders can be fulfilled.`,
      );
    }

    // Handle based on delivery type
    if (order.offer.deliveryType === 'AUTO_KEY') {
      return this.fulfillAutoKeyOrder(order);
    } else {
      return this.fulfillManualOrder(order);
    }
  }

  /**
   * Fulfill AUTO_KEY order with atomic key reservation
   */
  private async fulfillAutoKeyOrder(order: any): Promise<FulfillOrderResponse> {
    if (!order.offer.keyPool) {
      throw new BadRequestException('Offer has no key pool configured');
    }

    // Atomic key reservation using transaction + row locking
    const deliveredKey = await prisma.$transaction(async (tx) => {
      // Reserve and get a key atomically
      const keyCode = await this.keyPoolsService.reserveKey(
        order.offer.keyPool.id,
        order.id,
      );

      if (!keyCode) {
        throw new BadRequestException('No keys available in the pool');
      }

      // Mark key as delivered - find the reserved key
      const reservedKey = await tx.key.findFirst({
        where: { orderId: order.id, status: 'RESERVED' },
      });

      if (reservedKey) {
        await tx.key.update({
          where: { id: reservedKey.id },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
          },
        });
      }

      // Update order with delivered key and status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'FULFILLED',
          deliveredKey: keyCode, // Store decrypted key for buyer retrieval
        },
      });

      return keyCode;
    });

    // Fetch updated order
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    return {
      success: true,
      order: this.mapOrderToContract(updatedOrder!),
      deliveredKey,
    };
  }

  /**
   * Fulfill MANUAL order (just mark as fulfilled)
   */
  private async fulfillManualOrder(order: any): Promise<FulfillOrderResponse> {
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FULFILLED' },
    });

    return {
      success: true,
      order: this.mapOrderToContract(updatedOrder),
      deliveryInstructions: order.offer.deliveryInstructions || undefined,
    };
  }

  /**
   * Get existing fulfillment result (for idempotency)
   */
  private async getExistingFulfillmentResult(order: any): Promise<FulfillOrderResponse> {
    if (order.offer.deliveryType === 'AUTO_KEY') {
      // Get the delivered key
      const deliveredKey = order.deliveredKey || 
        await this.keyPoolsService.getDeliveredKeyForOrder(order.id);

      return {
        success: true,
        order: this.mapOrderToContract(order),
        deliveredKey: deliveredKey || undefined,
      };
    } else {
      return {
        success: true,
        order: this.mapOrderToContract(order),
        deliveryInstructions: order.offer.deliveryInstructions || undefined,
      };
    }
  }

  /**
   * Get order by ID (buyer view)
   */
  async getOrder(orderId: string, buyerId: string): Promise<GetOrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        offer: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.buyerId !== buyerId) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const response: GetOrderResponse = {
      order: this.mapOrderToContract(order),
    };

    // Only show delivered key if order is fulfilled
    if (order.status === 'FULFILLED') {
      if (order.offer.deliveryType === 'AUTO_KEY' && order.deliveredKey) {
        response.deliveredKey = order.deliveredKey;
      } else if (order.offer.deliveryType === 'MANUAL' && order.offer.deliveryInstructions) {
        response.deliveryInstructions = order.offer.deliveryInstructions;
      }
    }

    return response;
  }

  // ============================================
  // SELLER ORDER VIEWS
  // ============================================

  /**
   * Get seller's orders (for manual fulfillment dashboard)
   */
  async getSellerOrders(sellerId: string): Promise<GetSellerOrdersResponse> {
    const orders = await prisma.order.findMany({
      where: {
        offer: {
          sellerId,
        },
      },
      include: {
        offer: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      orders: orders.map((order) => ({
        ...this.mapSellerOrderToContract(order),
        offer: {
          id: order.offer.id,
          deliveryType: order.offer.deliveryType,
          variant: {
            sku: order.offer.variant.sku,
            product: {
              name: order.offer.variant.product.name,
            },
          },
        },
      })),
    };
  }

  /**
   * Get single order for seller (with full requirements)
   */
  async getSellerOrder(orderId: string, sellerId: string): Promise<GetSellerOrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        offer: {
          include: {
            variant: {
              include: {
                requirementTemplate: {
                  include: {
                    fields: {
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verify seller owns this order
    if (order.offer.sellerId !== sellerId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Decrypt and merge requirements payload
    const requirementsPayload = this.getDecryptedRequirementsPayload(order);

    // Build response
    const template = order.offer.variant.requirementTemplate;

    return {
      order: {
        ...this.mapOrderToContract(order),
        requirementsPayload,
      },
      offer: {
        id: order.offer.id,
        deliveryType: order.offer.deliveryType,
        deliveryInstructions: order.offer.deliveryInstructions,
        estimatedDeliveryMinutes: order.offer.estimatedDeliveryMinutes,
      },
      requirementTemplate: template
        ? {
            id: template.id,
            name: template.name,
            fields: template.fields.map((f) => ({
              key: f.key,
              label: f.label,
              type: f.type,
              sensitive: f.sensitive,
            })),
          }
        : null,
    };
  }

  /**
   * Helper: Decrypt and merge requirements payload
   */
  private getDecryptedRequirementsPayload(order: any): Record<string, unknown> | null {
    const regularData = (order.requirementsPayload as Record<string, unknown>) || {};
    let sensitiveData: Record<string, unknown> = {};

    // Decrypt sensitive data if present
    if (order.requirementsPayloadEncrypted) {
      try {
        const decrypted = this.cryptoService.decrypt(order.requirementsPayloadEncrypted);
        sensitiveData = JSON.parse(decrypted);
      } catch (error) {
        // Log error but don't expose to user
        console.error('Failed to decrypt requirements payload:', error);
      }
    }

    const merged = { ...regularData, ...sensitiveData };
    return Object.keys(merged).length > 0 ? merged : null;
  }

  /**
   * Helper: Map Prisma order to seller contract (with requirements)
   */
  private mapSellerOrderToContract(order: any): SellerOrder {
    return {
      ...this.mapOrderToContract(order),
      requirementsPayload: this.getDecryptedRequirementsPayload(order),
    };
  }

  /**
   * Helper: Map Prisma order to contract
   */
  private mapOrderToContract(order: any): Order {
    return {
      id: order.id,
      buyerId: order.buyerId,
      offerId: order.offerId,
      status: order.status,
      priceAmount: order.priceAmount,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
