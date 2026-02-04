import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto';
import type {
  Order,
  PayOrderResponse,
  FulfillOrderResponse,
  GetOrderResponse,
  GetSellerOrderResponse,
  GetSellerOrdersResponse,
} from '@workspace/contracts';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create order',
    description: `Create a new order for an offer. Order starts in PENDING status.
    
If the variant has a requirements template, the requirementsPayload must be provided with buyer data.`,
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Offer is not active, out of stock, or requirements validation failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
  })
  async createOrder(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.ordersService.createOrder(dto.buyerId, dto.offerId, dto.requirementsPayload);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order',
    description: 'Get order details. Shows delivered key only if order is fulfilled.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'buyerId',
    required: true,
    description: 'Buyer ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Order details with delivered key (if applicable)',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found or does not belong to buyer',
  })
  async getOrder(
    @Param('id') id: string,
    @Query('buyerId') buyerId: string,
  ): Promise<GetOrderResponse> {
    return this.ordersService.getOrder(id, buyerId);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pay order (MVP simulation)',
    description: 'Simulate payment for an order. In production, this would be a payment webhook. Sets order status to PAID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Order is not in PENDING status',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async payOrder(@Param('id') id: string): Promise<PayOrderResponse> {
    return this.ordersService.payOrder(id);
  }

  @Post(':id/fulfill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fulfill order',
    description: `
      Fulfill a PAID order. For AUTO_KEY offers, atomically reserves and delivers a key.
      
      **Idempotency**: Calling fulfill multiple times returns the same result (same key).
      
      **Concurrency Safety**: Uses row-level locking to prevent duplicate key delivery.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Order fulfilled successfully. Returns delivered key (AUTO_KEY) or instructions (MANUAL).',
  })
  @ApiResponse({
    status: 400,
    description: 'Order not in PAID status, or no keys available',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async fulfillOrder(@Param('id') id: string): Promise<FulfillOrderResponse> {
    return this.ordersService.fulfillOrder(id);
  }

  // ============================================
  // SELLER ORDER VIEWS
  // ============================================

  @Get('seller')
  @ApiOperation({
    summary: 'Get seller orders',
    description: 'List all orders for offers owned by the seller. Includes buyer requirements for manual fulfillment.',
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of seller orders',
  })
  async getSellerOrders(
    @Query('sellerId') sellerId: string,
  ): Promise<GetSellerOrdersResponse> {
    return this.ordersService.getSellerOrders(sellerId);
  }

  @Get('seller/:id')
  @ApiOperation({
    summary: 'Get seller order details',
    description: `Get detailed order view for seller including buyer-provided requirements.
    
Sensitive fields are decrypted for display. Only the seller who owns the order can access this.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Order details with buyer requirements',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to view this order',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async getSellerOrder(
    @Param('id') id: string,
    @Query('sellerId') sellerId: string,
  ): Promise<GetSellerOrderResponse> {
    return this.ordersService.getSellerOrder(id, sellerId);
  }
}
