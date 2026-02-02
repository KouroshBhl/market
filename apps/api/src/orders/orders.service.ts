import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import { KeyPoolsService } from '../key-pools/key-pools.service';
import type {
  Order,
  PayOrderResponse,
  FulfillOrderResponse,
  GetOrderResponse,
} from '@workspace/contracts';

@Injectable()
export class OrdersService {
  constructor(private readonly keyPoolsService: KeyPoolsService) {}

  /**
   * Create a new order (status: PENDING)
   */
  async createOrder(buyerId: string, offerId: string): Promise<Order> {
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

    // Create order
    const order = await prisma.order.create({
      data: {
        buyerId,
        offerId,
        status: 'PENDING',
        priceAmount: offer.priceAmount,
        currency: offer.currency,
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
