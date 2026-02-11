import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SellerProfileService } from './seller-profile.service';
import { AuthGuard } from '../auth/auth.guard';
import { SellerMemberGuard } from '../auth/seller-member.guard';
import { SellerPermissionGuard } from '../auth/seller-permission.guard';
import { RequireSellerPermission } from '../auth/seller-permission.decorator';
import type {
  GetStoreIdentityResponse,
  UpdateStoreIdentityRequest,
  UpdateStoreIdentityResponse,
} from '@workspace/contracts';

@ApiTags('Seller Profile')
@Controller()
export class SellerProfileController {
  constructor(private readonly sellerProfileService: SellerProfileService) {}

  // ============================================
  // GET /seller/:sellerId/settings/identity
  // Requires: membership (any team member can view)
  // ============================================

  @Get('seller/:sellerId/settings/identity')
  @UseGuards(AuthGuard, SellerMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get store identity settings',
    description: 'Retrieve store identity information (slug, display name, logo, bio, etc.)',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Store identity retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this seller' })
  @ApiResponse({ status: 404, description: 'Seller profile not found' })
  async getStoreIdentity(
    @Param('sellerId') sellerId: string,
  ): Promise<GetStoreIdentityResponse> {
    return this.sellerProfileService.getStoreIdentity(sellerId);
  }

  // ============================================
  // PATCH /seller/:sellerId/settings/identity
  // Requires: team.manage permission (owner or admin)
  // ============================================

  @Patch('seller/:sellerId/settings/identity')
  @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
  @RequireSellerPermission('team.manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update store identity settings',
    description:
      'Update editable store identity fields (display name, logo, bio, support response time, timezone, languages). Slug is immutable.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Store identity updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Seller profile not found' })
  async updateStoreIdentity(
    @Param('sellerId') sellerId: string,
    @Body() data: UpdateStoreIdentityRequest,
    @Req() req: any,
  ): Promise<UpdateStoreIdentityResponse> {
    const userId = req.user.id;
    return this.sellerProfileService.updateStoreIdentity(sellerId, userId, data);
  }
}
