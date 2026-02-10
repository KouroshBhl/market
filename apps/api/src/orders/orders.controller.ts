/**
 * Orders Controller — Buyer / System routes only
 *
 * Seller-facing order routes have been moved to SellerOrdersController
 * with proper authentication and authorization guards.
 */
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
  FulfillAutoKeyResponse,
  GetOrderResponse,
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
    summary: 'Get order (buyer view)',
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
    description: 'Simulate payment for an order. Sets order status to PAID.',
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

  @Post(':id/fulfill-auto')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fulfill AUTO_KEY order',
    description: `
      Fulfill a PAID AUTO_KEY order. Atomically reserves and delivers a key.
      
      **Idempotency**: Calling multiple times returns the same key.
      
      **Concurrency Safety**: Uses row-level locking (SKIP LOCKED) to prevent duplicate key delivery.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Order fulfilled successfully. Returns delivered key.',
  })
  @ApiResponse({
    status: 400,
    description: 'Order not in PAID status, not AUTO_KEY, or no keys available',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async fulfillAutoKey(@Param('id') id: string): Promise<FulfillAutoKeyResponse> {
    return this.ordersService.fulfillAutoKey(id);
  }
}
