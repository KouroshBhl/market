import {
  Controller,
  Get,
  Post,
  Patch,
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
  FulfillManualResponse,
  GetOrderResponse,
  GetSellerOrderResponse,
  GetSellerOrdersResponse,
  ClaimOrderResponse,
  ReassignOrderResponse,
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

  // ============================================
  // SELLER ORDER VIEWS - Must come BEFORE :id routes
  // ============================================

  @Get('seller')
  @ApiOperation({
    summary: 'List seller orders (cursor-based pagination)',
    description: `List seller orders with cursor-based pagination, sorting, and filtering.
    
**Cursor-based pagination:**
- Use \`cursor\` from previous response as \`cursor\` param for next page
- \`limit\` defaults to 20, max 100
- Returns \`items\` and \`nextCursor\` (null if no more pages)

**Sorting:**
- paidAt_desc (default): newest paid orders first
- paidAt_asc: oldest paid orders first
- buyerTotalAmount_desc: highest amount first
- buyerTotalAmount_asc: lowest amount first
- status_asc/status_desc: alphabetical by status

**Filter tabs:**
- all: All orders
- unassigned: PAID orders with no assignee
- needsFulfillment: PAID orders (any assignee)
- fulfilled: FULFILLED orders
- overdue: PAID manual orders past SLA (sorted oldest first)

Includes computed fields:
- isOverdue: Boolean indicating if manual order is past SLA
- slaDueAt: ISO timestamp when order becomes overdue (for manual orders)`,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor for pagination (opaque base64 string)',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (default 20, max 100)',
    type: Number,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort order',
    enum: ['paidAt_desc', 'paidAt_asc', 'buyerTotalAmount_desc', 'buyerTotalAmount_asc', 'status_asc', 'status_desc'],
  })
  @ApiQuery({
    name: 'filterTab',
    required: false,
    description: 'Filter by tab',
    enum: ['all', 'unassigned', 'needsFulfillment', 'fulfilled', 'overdue'],
  })
  @ApiResponse({
    status: 200,
    description: 'Cursor-based paginated list of seller orders',
  })
  async getSellerOrders(
    @Query('sellerId') sellerId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
    @Query('filterTab') filterTab?: string,
  ): Promise<{ items: any[]; nextCursor: string | null }> {
    return this.ordersService.getSellerOrders(
      sellerId,
      cursor,
      limit ? parseInt(limit.toString(), 10) : 20,
      sort || 'paidAt_desc',
      filterTab || 'all',
    );
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

  // ============================================
  // BUYER/GENERIC ORDER ROUTES - Come AFTER specific routes
  // ============================================

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

  @Post(':id/fulfill-manual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fulfill MANUAL order',
    description: `
      Fulfill a PAID MANUAL order (seller marks as fulfilled).
      
      **Idempotency**: Calling multiple times returns success.
      
      **Authorization**: Only the seller who owns the order can fulfill it.
    `,
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
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Order fulfilled successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Order not in PAID status or not MANUAL',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to fulfill this order (must be assignee or OWNER)',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async fulfillManual(
    @Param('id') id: string,
    @Query('sellerId') sellerId: string,
    @Query('userId') userId: string,
  ): Promise<FulfillManualResponse> {
    return this.ordersService.fulfillManual(id, sellerId, userId);
  }

  @Post('seller/orders/:id/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim order',
    description: `
      Seller team member claims an unassigned order.
      
      **Atomic**: Only succeeds if order is not already assigned.
      
      **Authorization**: User must be member of seller team.
      
      Sets assignedToUserId to current user and workState to IN_PROGRESS.
    `,
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
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Order claimed successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'User is not a member of seller team',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Order already assigned to another team member',
  })
  async claimOrder(
    @Param('id') id: string,
    @Query('sellerId') sellerId: string,
    @Query('userId') userId: string,
  ): Promise<ClaimOrderResponse> {
    return this.ordersService.claimOrder(id, sellerId, userId);
  }

  @Patch('seller/orders/:id/assignee')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reassign order (OWNER only)',
    description: `
      Owner reassigns order to another team member.
      
      **Authorization**: Only team OWNER can reassign orders.
    `,
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
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID (UUID) - will be from auth in production (must be OWNER)',
    type: String,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        assignedToUserId: { type: 'string', format: 'uuid' },
      },
      required: ['assignedToUserId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order reassigned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Target user is not a team member',
  })
  @ApiResponse({
    status: 403,
    description: 'Only team owners can reassign orders',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async reassignOrder(
    @Param('id') id: string,
    @Query('sellerId') sellerId: string,
    @Query('userId') userId: string,
    @Body() body: { assignedToUserId: string },
  ): Promise<ReassignOrderResponse> {
    return this.ordersService.reassignOrder(id, sellerId, userId, body);
  }

}
