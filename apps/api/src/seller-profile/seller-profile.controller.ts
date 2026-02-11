import {
  Controller,
  Get,
  Patch,
  Post,
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
  ChangeStoreSlugRequest,
  ChangeStoreSlugResponse,
  ResolveStoreSlugResponse,
} from '@workspace/contracts';

@ApiTags('Seller Profile')
@Controller()
export class SellerProfileController {
  constructor(private readonly sellerProfileService: SellerProfileService) {}

  // ============================================
  // GET /seller/:sellerId/settings/identity
  // ============================================

  @Get('seller/:sellerId/settings/identity')
  @UseGuards(AuthGuard, SellerMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get store identity settings',
    description:
      'Retrieve store identity: slug (public handle), seller display name (internal), logo, bio, timezone.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller profile ID' })
  @ApiResponse({ status: 200, description: 'Store identity retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getStoreIdentity(
    @Param('sellerId') sellerId: string,
  ): Promise<GetStoreIdentityResponse> {
    return this.sellerProfileService.getStoreIdentity(sellerId);
  }

  // ============================================
  // PATCH /seller/:sellerId/settings/identity
  // ============================================

  @Patch('seller/:sellerId/settings/identity')
  @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
  @RequireSellerPermission('team.manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update store identity settings',
    description:
      'Update seller display name (internal), logo, bio, timezone. Slug is NOT editable here.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller profile ID' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateStoreIdentity(
    @Param('sellerId') sellerId: string,
    @Body() data: UpdateStoreIdentityRequest,
    @Req() req: any,
  ): Promise<UpdateStoreIdentityResponse> {
    return this.sellerProfileService.updateStoreIdentity(sellerId, req.user.id, data);
  }

  // ============================================
  // POST /seller/:sellerId/settings/identity/change-slug
  // ONE-TIME OPERATION
  // ============================================

  @Post('seller/:sellerId/settings/identity/change-slug')
  @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
  @RequireSellerPermission('team.manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change store handle (one-time only)',
    description:
      'Change the store URL handle. Can only be done ONCE. Previous handle is saved for redirect.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller profile ID' })
  @ApiResponse({ status: 200, description: 'Slug changed' })
  @ApiResponse({ status: 400, description: 'Invalid format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Already changed once or insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  async changeStoreSlug(
    @Param('sellerId') sellerId: string,
    @Body() data: ChangeStoreSlugRequest,
    @Req() req: any,
  ): Promise<ChangeStoreSlugResponse> {
    return this.sellerProfileService.changeStoreSlug(sellerId, req.user.id, data);
  }

  // ============================================
  // GET /public/store/resolve/:slug
  // Public — no auth required
  // Resolves slug (current or historical) → current slug + redirect flag
  // ============================================

  @Get('public/store/resolve/:slug')
  @ApiOperation({
    summary: 'Resolve store slug (public)',
    description:
      'Given a slug, returns the current slug and whether a redirect is needed (if the slug is historical).',
  })
  @ApiParam({ name: 'slug', description: 'Current or historical store slug' })
  @ApiResponse({ status: 200, description: 'Slug resolved' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async resolveStoreSlug(
    @Param('slug') slug: string,
  ): Promise<ResolveStoreSlugResponse> {
    return this.sellerProfileService.resolveSlug(slug);
  }
}
