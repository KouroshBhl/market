import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SellerGatewaysService } from './seller-gateways.service';
import { AuthGuard } from '../auth/auth.guard';
import { SellerMemberGuard } from '../auth/seller-member.guard';
import { SellerPermissionGuard } from '../auth/seller-permission.guard';
import { RequireSellerPermission } from '../auth/seller-permission.decorator';
import { UpdateSellerGatewayDto } from './dto';
import type {
  GetSellerGatewaysResponse,
  UpdateSellerGatewayResponse,
} from '@workspace/contracts';

@ApiTags('Seller Gateways')
@Controller()
export class SellerGatewaysController {
  constructor(private readonly gatewaysService: SellerGatewaysService) {}

  // ============================================
  // GET /seller/:sellerId/gateways
  // Any active seller member can view gateways
  // ============================================

  @Get('seller/:sellerId/gateways')
  @UseGuards(AuthGuard, SellerMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List seller gateways with effective status',
    description:
      'Returns all platform gateways with the seller\'s effective enabled state. ' +
      'Any active member can view. Sorted by sort_order.',
  })
  @ApiParam({
    name: 'sellerId',
    description: 'Seller ID (UUID)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of gateways with effective status',
    schema: {
      type: 'object',
      properties: {
        gateways: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gateway: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string', example: 'Zibal Checkout' },
                  provider: { type: 'string', example: 'zibal' },
                  isEnabledGlobally: { type: 'boolean' },
                  sellerCanToggle: { type: 'boolean' },
                  defaultEnabledForNewSellers: { type: 'boolean' },
                  sortOrder: { type: 'number' },
                },
              },
              sellerPreference: {
                type: 'object',
                nullable: true,
                properties: {
                  isEnabled: { type: 'boolean' },
                },
              },
              effectiveEnabled: { type: 'boolean' },
              status: {
                type: 'string',
                enum: ['AVAILABLE', 'ADMIN_LOCKED', 'GLOBALLY_DISABLED'],
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Not a member of this organization' })
  async getSellerGateways(
    @Param('sellerId') sellerId: string,
  ): Promise<GetSellerGatewaysResponse> {
    return this.gatewaysService.getSellerGateways(sellerId);
  }

  // ============================================
  // PATCH /seller/:sellerId/gateways/:gatewayId
  // Requires: payouts.manage (owner only in current RBAC)
  // ============================================

  @Patch('seller/:sellerId/gateways/:gatewayId')
  @UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
  @RequireSellerPermission('payouts.manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle a gateway for the seller',
    description:
      'Enable or disable a platform gateway for this seller. ' +
      'Cannot toggle admin-locked or globally-disabled gateways. ' +
      'Cannot disable the last remaining enabled gateway.',
  })
  @ApiParam({
    name: 'sellerId',
    description: 'Seller ID (UUID)',
    type: String,
  })
  @ApiParam({
    name: 'gatewayId',
    description: 'Platform gateway ID (UUID)',
    type: String,
  })
  @ApiBody({ type: UpdateSellerGatewayDto })
  @ApiResponse({
    status: 200,
    description: 'Gateway preference updated',
    schema: {
      type: 'object',
      properties: {
        gateway: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            provider: { type: 'string' },
            isEnabledGlobally: { type: 'boolean' },
            sellerCanToggle: { type: 'boolean' },
            defaultEnabledForNewSellers: { type: 'boolean' },
            sortOrder: { type: 'number' },
          },
        },
        sellerPreference: {
          type: 'object',
          properties: {
            isEnabled: { type: 'boolean' },
          },
        },
        effectiveEnabled: { type: 'boolean' },
        status: {
          type: 'string',
          enum: ['AVAILABLE', 'ADMIN_LOCKED', 'GLOBALLY_DISABLED'],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Gateway is admin-locked or insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Gateway not found' })
  @ApiResponse({
    status: 409,
    description:
      'Gateway is globally disabled, or disabling would leave zero enabled gateways',
  })
  async updateSellerGateway(
    @Param('sellerId') sellerId: string,
    @Param('gatewayId') gatewayId: string,
    @Body() dto: UpdateSellerGatewayDto,
  ): Promise<UpdateSellerGatewayResponse> {
    return this.gatewaysService.updateSellerGateway(
      sellerId,
      gatewayId,
      dto.isEnabled,
    );
  }
}
