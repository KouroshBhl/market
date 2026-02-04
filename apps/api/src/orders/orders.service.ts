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
import { SellerTeamService } from '../seller-team/seller-team.service';
import type {
  Order,
  PayOrderResponse,
  FulfillAutoKeyResponse,
  FulfillManualResponse,
  GetOrderResponse,
  RequirementsPayload,
  GetSellerOrderResponse,
  GetSellerOrdersResponse,
  SellerOrder,
  ClaimOrderResponse,
  ReassignOrder,
  ReassignOrderResponse,
} from '@workspace/contracts';

@Injectable()
export class OrdersService {
  constructor(
    private readonly keyPoolsService: KeyPoolsService,
    private readonly requirementsService: RequirementsService,
    private readonly cryptoService: CryptoService,
    private readonly sellerTeamService: SellerTeamService,
  ) {}

  /**
   * Create a new order (status: PENDING_PAYMENT)
   * Snapshots pricing including platform fee
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

    // Get platform fee settings
    const platformSettings = await prisma.platformSettings.findFirst();
    const platformFeeBps = platformSettings?.platformFeeBps || 300; // Default 3%

    // Calculate pricing with snapshots
    const basePriceAmount = offer.priceAmount; // Seller's price in cents
    const feeAmount = Math.round((basePriceAmount * platformFeeBps) / 10000);
    const buyerTotalAmount = basePriceAmount + feeAmount;

    // Create order with price snapshots
    const order = await prisma.order.create({
      data: {
        buyerId,
        sellerId: offer.sellerId,
        offerId,
        status: 'PENDING_PAYMENT',
        basePriceAmount,
        platformFeeBpsSnapshot: platformFeeBps,
        feeAmount,
        buyerTotalAmount,
        currency: offer.currency,
        requirementsPayload: storedPayload as any,
        requirementsPayloadEncrypted: encryptedPayload,
      },
    });

    return this.mapOrderToContract(order);
  }

  /**
   * Simulate payment (MVP)
   * In production, this would be a webhook from payment provider
   * For AUTO_KEY offers, can trigger auto-fulfillment inline
   */
  async payOrder(orderId: string): Promise<PayOrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { offer: { include: { keyPool: true } } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        `Cannot pay order with status ${order.status}. Only PENDING_PAYMENT orders can be paid.`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return {
      success: true,
      order: this.mapOrderToContract(updatedOrder),
    };
  }

  /**
   * Fulfill AUTO_KEY order atomically
   * MUST be idempotent: calling twice returns same result
   */
  async fulfillAutoKey(orderId: string): Promise<FulfillAutoKeyResponse> {
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

    // Idempotency check: if already fulfilled, return existing key
    if (order.status === 'FULFILLED') {
      if (!order.deliveredKey) {
        throw new ConflictException('Order is fulfilled but no key was found');
      }
      return {
        success: true,
        order: this.mapOrderToContract(order),
        deliveredKey: order.deliveredKey,
      };
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException(
        `Cannot fulfill order with status ${order.status}. Only PAID orders can be fulfilled.`,
      );
    }

    if (order.offer.deliveryType !== 'AUTO_KEY') {
      throw new BadRequestException('This endpoint is only for AUTO_KEY orders');
    }

    if (!order.offer.keyPool) {
      throw new BadRequestException('Offer has no key pool configured');
    }

    // Atomic key reservation using transaction + row locking
    const deliveredKey = await prisma.$transaction(async (tx) => {
      // Reserve and get a key atomically (uses SKIP LOCKED)
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
          fulfilledAt: new Date(),
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
   * Fulfill MANUAL order (seller team member marks as fulfilled)
   * MUST be idempotent: calling twice returns same result
   * Authorization: Only assignee or OWNER can fulfill
   */
  async fulfillManual(orderId: string, sellerId: string, userId: string): Promise<FulfillManualResponse> {
    // Get order with offer details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        offer: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verify seller owns this order
    if (order.sellerId !== sellerId) {
      throw new ForbiddenException('Order does not belong to this seller');
    }

    // Idempotency check: if already fulfilled, return success
    if (order.status === 'FULFILLED') {
      return {
        success: true,
        order: this.mapOrderToContract(order),
      };
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException(
        `Cannot fulfill order with status ${order.status}. Only PAID orders can be fulfilled.`,
      );
    }

    if (order.offer.deliveryType !== 'MANUAL') {
      throw new BadRequestException('This endpoint is only for MANUAL orders');
    }

    // Check authorization: must be assignee OR owner
    const role = await this.sellerTeamService.getMemberRole(sellerId, userId);
    if (!role) {
      throw new ForbiddenException('User is not a member of this seller team');
    }

    const isAssignee = order.assignedToUserId === userId;
    const isOwner = role === 'OWNER';

    if (!isAssignee && !isOwner) {
      throw new ForbiddenException('Only the assigned team member or team owner can fulfill this order');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { 
        status: 'FULFILLED',
        fulfilledAt: new Date(),
        workState: 'DONE',
      },
    });

    return {
      success: true,
      order: this.mapOrderToContract(updatedOrder),
    };
  }

  // ============================================
  // SELLER TEAM ASSIGNMENT WORKFLOW
  // ============================================

  /**
   * Seller team member claims an order (atomically to prevent race conditions)
   */
  async claimOrder(orderId: string, sellerId: string, userId: string): Promise<ClaimOrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { assignedTo: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verify order belongs to this seller
    if (order.sellerId !== sellerId) {
      throw new ForbiddenException('Order does not belong to this seller');
    }

    // Verify user is team member
    const role = await this.sellerTeamService.getMemberRole(sellerId, userId);
    if (!role) {
      throw new ForbiddenException('User is not a member of this seller team');
    }

    // Check if already assigned
    if (order.assignedToUserId) {
      const assignee = order.assignedTo;
      throw new ConflictException(
        `Order is already assigned to ${assignee?.name || assignee?.email || 'another user'}`
      );
    }

    // Atomic claim: only succeed if assignedToUserId is null
    try {
      const updatedOrder = await prisma.order.update({
        where: { 
          id: orderId,
          assignedToUserId: null, // Only update if not already assigned
        },
        data: {
          assignedToUserId: userId,
          assignedAt: new Date(),
          workState: 'IN_PROGRESS',
        },
        include: {
          assignedTo: true, // Include user data for response
        },
      });

      return {
        success: true,
        order: {
          ...this.mapOrderToContract(updatedOrder),
          assignedToUserId: updatedOrder.assignedToUserId,
          assignedAt: updatedOrder.assignedAt?.toISOString() || null,
          workState: updatedOrder.workState,
          assignedTo: updatedOrder.assignedTo
            ? {
                id: updatedOrder.assignedTo.id,
                email: updatedOrder.assignedTo.email,
                name: updatedOrder.assignedTo.name,
              }
            : null,
        },
      };
    } catch (error) {
      throw new ConflictException('Order is already assigned to another team member');
    }
  }

  /**
   * Owner reassigns order to another team member
   */
  async reassignOrder(
    orderId: string,
    sellerId: string,
    currentUserId: string,
    dto: ReassignOrder,
  ): Promise<ReassignOrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verify order belongs to this seller
    if (order.sellerId !== sellerId) {
      throw new ForbiddenException('Order does not belong to this seller');
    }

    // Verify current user is OWNER
    const role = await this.sellerTeamService.getMemberRole(sellerId, currentUserId);
    if (role !== 'OWNER') {
      throw new ForbiddenException('Only team owners can reassign orders');
    }

    // Verify target user is team member
    const targetRole = await this.sellerTeamService.getMemberRole(sellerId, dto.assignedToUserId);
    if (!targetRole) {
      throw new BadRequestException('Target user is not a member of this seller team');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedToUserId: dto.assignedToUserId,
        assignedAt: new Date(),
        workState: 'IN_PROGRESS',
      },
    });

    return {
      success: true,
      order: {
        ...this.mapOrderToContract(updatedOrder),
        assignedToUserId: updatedOrder.assignedToUserId,
        assignedAt: updatedOrder.assignedAt?.toISOString() || null,
        workState: updatedOrder.workState,
      },
    };
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
   * Get seller's orders (cursor-based pagination with sorting and filtering)
   * Includes computed fields: isOverdue, slaDueAt, assignee info
   */
  async getSellerOrders(
    sellerId: string,
    cursor?: string,
    limit: number = 20,
    sort: string = 'paidAt_desc',
    filterTab: string = 'all',
  ): Promise<{
    items: any[];
    nextCursor: string | null;
  }> {
    // Parse cursor (base64 encoded order ID)
    let cursorId: string | undefined;
    if (cursor) {
      try {
        cursorId = Buffer.from(cursor, 'base64').toString('utf-8');
      } catch {
        throw new BadRequestException('Invalid cursor');
      }
    }

    // Build where clause based on filter tab
    const where: any = {
      sellerId,
    };

    switch (filterTab) {
      case 'unassigned':
        where.assignedToUserId = null;
        where.status = 'PAID';
        break;
      case 'needsFulfillment':
        where.status = 'PAID';
        break;
      case 'fulfilled':
        where.status = 'FULFILLED';
        break;
      case 'overdue':
        // Overdue: MANUAL orders that are PAID and past SLA
        where.status = 'PAID';
        where.offer = {
          deliveryType: 'MANUAL',
        };
        // Note: Cannot filter overdue in DB easily; will filter in memory
        break;
    }

    // Add cursor condition
    if (cursorId) {
      where.id = {
        not: cursorId,
      };
    }

    // Parse sort
    let orderBy: any = {};
    switch (sort) {
      case 'paidAt_asc':
        orderBy = { paidAt: 'asc' };
        break;
      case 'paidAt_desc':
        orderBy = { paidAt: 'desc' };
        break;
      case 'buyerTotalAmount_asc':
        orderBy = { buyerTotalAmount: 'asc' };
        break;
      case 'buyerTotalAmount_desc':
        orderBy = { buyerTotalAmount: 'desc' };
        break;
      case 'status_asc':
        orderBy = { status: 'asc' };
        break;
      case 'status_desc':
        orderBy = { status: 'desc' };
        break;
      default:
        orderBy = { paidAt: 'desc' };
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
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
        assignedTo: true,
      },
      orderBy,
      take: limit + 1, // Fetch one extra to determine if there's a next page
      ...(cursorId && {
        cursor: {
          id: cursorId,
        },
        skip: 1, // Skip the cursor itself
      }),
    });

    // Filter overdue in memory if needed
    let filteredOrders = orders;
    if (filterTab === 'overdue') {
      filteredOrders = orders.filter((order) => {
        const { isOverdue } = this.computeOverdueStatus(order, order.offer);
        return isOverdue;
      });

      // Sort overdue by paidAt asc (oldest first)
      filteredOrders.sort((a, b) => {
        if (!a.paidAt || !b.paidAt) return 0;
        return a.paidAt.getTime() - b.paidAt.getTime();
      });
    }

    // Check if there's a next page
    const hasMore = filteredOrders.length > limit;
    const items = hasMore ? filteredOrders.slice(0, limit) : filteredOrders;

    // Generate next cursor
    const nextCursor = hasMore
      ? Buffer.from(items[items.length - 1].id).toString('base64')
      : null;

    return {
      items: items.map((order) => {
        const { isOverdue, slaDueAt } = this.computeOverdueStatus(
          order,
          order.offer,
        );

        return {
          ...this.mapOrderToContract(order),
          requirementsPayload: this.getDecryptedRequirementsPayload(order),
          isOverdue,
          slaDueAt,
          assignedToUserId: order.assignedToUserId,
          workState: order.workState,
          assignedTo: order.assignedTo
            ? {
                id: order.assignedTo.id,
                email: order.assignedTo.email,
                name: order.assignedTo.name,
              }
            : null,
          offer: {
            id: order.offer.id,
            deliveryType: order.offer.deliveryType,
            estimatedDeliveryMinutes: order.offer.estimatedDeliveryMinutes,
            variant: {
              sku: order.offer.variant.sku,
              region: order.offer.variant.region,
              product: {
                name: order.offer.variant.product.name,
              },
            },
          },
        };
      }),
      nextCursor,
    };
  }

  /**
   * Compute if order is overdue based on paidAt + SLA
   * Only applies to MANUAL delivery PAID orders
   */
  private computeOverdueStatus(
    order: any,
    offer: any,
  ): { isOverdue: boolean; slaDueAt: string | null } {
    // Only MANUAL orders with SLA can be overdue
    if (
      offer.deliveryType !== 'MANUAL' ||
      !offer.estimatedDeliveryMinutes ||
      order.status !== 'PAID' ||
      !order.paidAt
    ) {
      return { isOverdue: false, slaDueAt: null };
    }

    const paidAt = new Date(order.paidAt);
    const slaDueAt = new Date(paidAt.getTime() + offer.estimatedDeliveryMinutes * 60 * 1000);
    const now = new Date();
    const isOverdue = now > slaDueAt;

    return {
      isOverdue,
      slaDueAt: slaDueAt.toISOString(),
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
        assignedTo: true, // CRITICAL: Include assignee user data
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
        // CRITICAL: Include assignment fields for seller UI
        assignedToUserId: order.assignedToUserId,
        workState: order.workState,
        assignedTo: order.assignedTo
          ? {
              id: order.assignedTo.id,
              email: order.assignedTo.email,
              name: order.assignedTo.name,
            }
          : null,
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
   * Helper: Map Prisma order to contract
   */
  private mapOrderToContract(order: any): Order {
    return {
      id: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      offerId: order.offerId,
      status: order.status,
      basePriceAmount: order.basePriceAmount,
      platformFeeBpsSnapshot: order.platformFeeBpsSnapshot,
      feeAmount: order.feeAmount,
      buyerTotalAmount: order.buyerTotalAmount,
      currency: order.currency,
      paidAt: order.paidAt?.toISOString() || null,
      fulfilledAt: order.fulfilledAt?.toISOString() || null,
      cancelledAt: order.cancelledAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
