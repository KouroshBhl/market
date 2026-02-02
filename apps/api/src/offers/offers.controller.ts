import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import type {
  Offer,
  SaveOfferDraft,
  PublishOffer,
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
  async saveDraft(@Body() data: SaveOfferDraft): Promise<Offer> {
    return this.offersService.saveDraft(data);
  }

  @Post('offers/publish')
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
  async publish(@Body() data: PublishOffer): Promise<Offer> {
    return this.offersService.publish(data);
  }

  @Patch('offers/:id/status')
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
