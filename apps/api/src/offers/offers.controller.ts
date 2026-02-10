/**
 * Seller Offers Controller
 *
 * SECURITY FIX (2026-02-10): All seller offer routes now require:
 *   1. AuthGuard — JWT Bearer token (identifies the user)
 *   2. SellerMemberGuard — validates user is ACTIVE member of :sellerId org
 *   3. SellerPermissionGuard — checks RBAC permission (via @RequireSellerPermission)
 *
 * ROOT CAUSE of the previous data leak:
 *   - sellerId was accepted from query params / request body without authentication
 *   - Several routes had NO auth guards at all (e.g. GET /seller/offers)
 *   - No ownership verification on offer mutations
 *
 * sellerId is now ALWAYS derived from `request.sellerMember.sellerId` which is
 * set by SellerMemberGuard after verifying the authenticated user's membership.
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { AuthGuard } from '../auth/auth.guard';
import { SellerMemberGuard } from '../auth/seller-member.guard';
import { SellerPermissionGuard } from '../auth/seller-permission.guard';
import { RequireSellerPermission } from '../auth/seller-permission.decorator';
import type {
  Offer,
  SaveOfferDraft,
  PublishOffer,
  UpdateOffer,
  UpdateOfferStatus,
  GetSellerOffersResponse,
  OfferWithDetails,
} from '@workspace/contracts';

@ApiTags('Offers (Seller)')
@Controller('seller/:sellerId')
@UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
@ApiBearerAuth()
export class OffersController {
  private readonly logger = new Logger(OffersController.name);

  constructor(private readonly offersService: OffersService) {}

  @Get('offers')
  @ApiOperation({
    summary: 'List seller offers',
    description:
      'List all offers for the authenticated seller. sellerId is derived from the authenticated membership — never from query params.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'List of seller offers' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not a member of this seller organization' })
  async getSellerOffers(@Req() req: any): Promise<GetSellerOffersResponse> {
    const sellerId = req.sellerMember.sellerId;
    return this.offersService.getSellerOffers(sellerId);
  }

  @Get('offers/:id')
  @ApiOperation({
    summary: 'Get offer details',
    description: 'Get a single offer by ID. Only accessible if the offer belongs to the authenticated seller.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'id', description: 'Offer ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Offer details' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not a member of this seller organization' })
  @ApiResponse({ status: 404, description: 'Offer not found or does not belong to seller' })
  async getOfferById(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<OfferWithDetails> {
    const sellerId = req.sellerMember.sellerId;
    return this.offersService.getOfferById(id, sellerId);
  }

  @Post('offers/draft')
  @RequireSellerPermission('offers.manage')
  @ApiOperation({
    summary: 'Save offer draft',
    description:
      'Create or update an offer draft. sellerId is derived from authenticated membership. Any sellerId in the body is ignored.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: 'Draft saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async saveDraft(
    @Body() data: SaveOfferDraft,
    @Req() req: any,
  ): Promise<Offer> {
    const sellerId = req.sellerMember.sellerId;
    // Override any sellerId from the body with the authenticated one
    return this.offersService.saveDraft({ ...data, sellerId }, sellerId);
  }

  @Post('offers/publish')
  @RequireSellerPermission('offers.manage')
  @ApiOperation({
    summary: 'Publish offer',
    description:
      'Publish an offer. sellerId is derived from authenticated membership. Any sellerId in the body is ignored.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: 'Offer published successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async publish(
    @Body() data: PublishOffer,
    @Req() req: any,
  ): Promise<Offer> {
    const sellerId = req.sellerMember.sellerId;
    // Override any sellerId from the body with the authenticated one
    return this.offersService.publish({ ...data, sellerId }, sellerId);
  }

  @Patch('offers/:id')
  @RequireSellerPermission('offers.manage')
  @ApiOperation({
    summary: 'Update offer',
    description:
      'Update offer fields. Only the seller who owns the offer can update it.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'id', description: 'Offer ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Offer updated successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized or offer does not belong to seller' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async updateOffer(
    @Param('id') id: string,
    @Body() data: UpdateOffer,
    @Req() req: any,
  ): Promise<Offer> {
    const sellerId = req.sellerMember.sellerId;
    return this.offersService.updateOffer(id, data, sellerId);
  }

  @Patch('offers/:id/status')
  @RequireSellerPermission('offers.manage')
  @ApiOperation({
    summary: 'Update offer status',
    description:
      'Toggle offer status between active and inactive. Only the seller who owns the offer can change its status.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'id', description: 'Offer ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized or offer does not belong to seller' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateOfferStatus,
    @Req() req: any,
  ): Promise<Offer> {
    const sellerId = req.sellerMember.sellerId;
    return this.offersService.updateStatus(id, data, sellerId);
  }
}
