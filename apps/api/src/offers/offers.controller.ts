import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { AuthGuard } from '../auth/auth.guard';
import { EmailVerifiedGuard } from '../auth/email-verified.guard';
import type {
  Offer,
  SaveOfferDraft,
  PublishOffer,
  UpdateOffer,
  UpdateOfferStatus,
  GetSellerOffersResponse,
} from '@workspace/contracts';

@ApiTags('Offers')
@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get('seller/offers')
  @ApiOperation({
    summary: 'Get seller offers',
    description: 'List all offers for a seller with variant and product details',
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of seller offers',
  })
  async getSellerOffers(
    @Query('sellerId') sellerId: string,
  ): Promise<GetSellerOffersResponse> {
    return this.offersService.getSellerOffers(sellerId);
  }

  @Post('offers/draft')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save offer draft',
    description:
      'Create or update an offer draft. No validation on required fields. Returns the saved draft.',
  })
  @ApiResponse({
    status: 201,
    description: 'Draft saved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified (EMAIL_NOT_VERIFIED)',
  })
  async saveDraft(@Body() data: SaveOfferDraft): Promise<Offer> {
    return this.offersService.saveDraft(data);
  }

  @Post('offers/publish')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publish offer',
    description:
      'Publish an offer. Validates all required fields and sets status to active.',
  })
  @ApiResponse({
    status: 201,
    description: 'Offer published successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified (EMAIL_NOT_VERIFIED)',
  })
  async publish(@Body() data: PublishOffer): Promise<Offer> {
    return this.offersService.publish(data);
  }

  @Patch('offers/:id')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update offer',
    description: 'Update offer fields (pricing, description). Works for draft and active offers.',
  })
  @ApiParam({
    name: 'id',
    description: 'Offer ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Offer updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified (EMAIL_NOT_VERIFIED)',
  })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
  })
  async updateOffer(
    @Param('id') id: string,
    @Body() data: UpdateOffer,
  ): Promise<Offer> {
    return this.offersService.updateOffer(id, data);
  }

  @Patch('offers/:id/status')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update offer status',
    description: 'Toggle offer status between active and inactive. Cannot modify draft offers.',
  })
  @ApiParam({
    name: 'id',
    description: 'Offer ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified (EMAIL_NOT_VERIFIED)',
  })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateOfferStatus,
  ): Promise<Offer> {
    return this.offersService.updateStatus(id, data);
  }
}
