import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SellerTeamService } from './seller-team.service';
import type { GetSellerTeamResponse } from '@workspace/contracts';

@ApiTags('Seller Team')
@Controller('seller/team')
export class SellerTeamController {
  constructor(private readonly sellerTeamService: SellerTeamService) {}

  @Get()
  @ApiOperation({
    summary: 'Get seller team members',
    description: 'List active team members for a seller (for order assignment dropdown)',
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of team members',
  })
  async getTeamMembers(
    @Query('sellerId') sellerId: string,
  ): Promise<GetSellerTeamResponse> {
    return this.sellerTeamService.getTeamMembers(sellerId);
  }
}
