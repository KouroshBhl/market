/**
 * Seller Orders Controller
 *
 * SECURITY FIX (2026-02-10): Seller order routes extracted from OrdersController
 * and secured with SellerMemberGuard + SellerPermissionGuard.
 *
 * All routes require:
 *   1. AuthGuard — JWT Bearer token
 *   2. SellerMemberGuard — validates user is ACTIVE member of :sellerId org
 *   3. SellerPermissionGuard — checks RBAC permission
 *
 * sellerId and userId are ALWAYS derived from `request.sellerMember` / `request.user`,
 * NEVER from query params or request body.
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../auth/auth.guard';
import { SellerMemberGuard } from '../auth/seller-member.guard';
import { SellerPermissionGuard } from '../auth/seller-permission.guard';
import { RequireSellerPermission } from '../auth/seller-permission.decorator';
import type {
  GetSellerOrderResponse,
  FulfillManualResponse,
  ClaimOrderResponse,
  ReassignOrderResponse,
} from '@workspace/contracts';

@ApiTags('Orders (Seller)')
@Controller('seller/:sellerId/orders')
@UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
@ApiBearerAuth()
export class SellerOrdersController {
  private readonly logger = new Logger(SellerOrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List seller orders (cursor-based pagination)',
    description:
      'List seller orders with cursor-based pagination, sorting, and filtering. sellerId is derived from authenticated membership.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor for pagination', type: String })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default 20, max 100)', type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['paidAt_desc', 'paidAt_asc', 'buyerTotalAmount_desc', 'buyerTotalAmount_asc', 'status_asc', 'status_desc'] })
  @ApiQuery({ name: 'filterTab', required: false, enum: ['all', 'unassigned', 'needsFulfillment', 'fulfilled', 'overdue'] })
  @ApiResponse({ status: 200, description: 'Cursor-based paginated list of seller orders' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not a member of this seller organization' })
  async getSellerOrders(
    @Req() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
    @Query('filterTab') filterTab?: string,
  ): Promise<{ items: any[]; nextCursor: string | null }> {
    const sellerId = req.sellerMember.sellerId;
    return this.ordersService.getSellerOrders(
      sellerId,
      cursor,
      limit ? parseInt(limit.toString(), 10) : 20,
      sort || 'paidAt_desc',
      filterTab || 'all',
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get seller order details',
    description:
      'Get detailed order view for seller. Only accessible for orders belonging to the authenticated seller.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Order details with buyer requirements' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized to view this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getSellerOrder(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<GetSellerOrderResponse> {
    const sellerId = req.sellerMember.sellerId;
    return this.ordersService.getSellerOrder(id, sellerId);
  }

  @Post(':id/fulfill-manual')
  @RequireSellerPermission('orders.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fulfill MANUAL order',
    description:
      'Seller marks a manual order as fulfilled. userId is derived from the authenticated user.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Order fulfilled successfully' })
  @ApiResponse({ status: 400, description: 'Order not in PAID status or not MANUAL' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized to fulfill this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async fulfillManual(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<FulfillManualResponse> {
    const sellerId = req.sellerMember.sellerId;
    const userId = req.user.userId;
    return this.ordersService.fulfillManual(id, sellerId, userId);
  }

  @Post(':id/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim order',
    description:
      'Seller team member claims an unassigned order. userId is derived from the authenticated user.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Order claimed successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'User is not a member of seller team' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Order already assigned' })
  async claimOrder(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ClaimOrderResponse> {
    const sellerId = req.sellerMember.sellerId;
    const userId = req.user.userId;
    return this.ordersService.claimOrder(id, sellerId, userId);
  }

  @Patch(':id/assignee')
  @RequireSellerPermission('orders.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reassign order (OWNER only)',
    description: 'Owner reassigns order to another team member.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        assignedToUserId: { type: 'string', format: 'uuid' },
      },
      required: ['assignedToUserId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Order reassigned successfully' })
  @ApiResponse({ status: 400, description: 'Target user is not a team member' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Only team owners can reassign orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async reassignOrder(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { assignedToUserId: string },
  ): Promise<ReassignOrderResponse> {
    const sellerId = req.sellerMember.sellerId;
    const userId = req.user.userId;
    return this.ordersService.reassignOrder(id, sellerId, userId, body);
  }
}
