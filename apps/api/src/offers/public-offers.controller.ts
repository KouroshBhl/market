import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PublicOffersService } from './public-offers.service';
import type { GetPublicOffersByVariantResponse } from '../contracts/offers/get-public-offers.contract';

@ApiTags('Public Offers')
@Controller('public/offers')
export class PublicOffersController {
  constructor(private readonly publicOffersService: PublicOffersService) {}

  @Get('by-variant/:variantId')
  @ApiOperation({
    summary: 'Get active offers for a variant (buyer-facing)',
    description:
      'Returns all active offers for a given catalog variant with seller display names, delivery type, pricing, and availability.',
  })
  @ApiParam({ name: 'variantId', description: 'Catalog variant ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'List of active offers for the variant' })
  async getOffersByVariant(
    @Param('variantId') variantId: string,
  ): Promise<GetPublicOffersByVariantResponse> {
    return this.publicOffersService.getOffersByVariant(variantId);
  }
}
