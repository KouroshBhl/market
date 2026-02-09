import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PresenceService } from './presence.service';
import { AuthGuard } from '../auth/auth.guard';
import { SellerMemberGuard } from '../auth/seller-member.guard';

@ApiTags('Presence')
@Controller()
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  // ============================================
  // POST /seller/:sellerId/presence/heartbeat
  // ============================================

  @Post('seller/:sellerId/presence/heartbeat')
  @UseGuards(AuthGuard, SellerMemberGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send presence heartbeat',
    description:
      'Updates last_seen_at for the authenticated member. Optionally updates last_active_at. Rate-limited to once per 10s.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lastActiveAt: {
          type: 'string',
          format: 'date-time',
          description: 'ISO 8601 timestamp of last user activity (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Heartbeat recorded',
    schema: {
      type: 'object',
      properties: {
        sellerId: { type: 'string' },
        userId: { type: 'string' },
        lastSeenAt: { type: 'string', format: 'date-time' },
        lastActiveAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Not a member of this seller' })
  async heartbeat(
    @Param('sellerId') sellerId: string,
    @Body() body: { lastActiveAt?: string },
    @Req() req: any,
  ) {
    return this.presenceService.heartbeat(
      sellerId,
      req.user.userId,
      body.lastActiveAt,
    );
  }

  // ============================================
  // GET /seller/:sellerId/presence
  // ============================================

  @Get('seller/:sellerId/presence')
  @UseGuards(AuthGuard, SellerMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get presence list for seller',
    description:
      'Returns presence status (online/away/offline) for all members who have sent a heartbeat.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiResponse({
    status: 200,
    description: 'Presence list',
    schema: {
      type: 'object',
      properties: {
        presences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              lastSeenAt: { type: 'string', format: 'date-time' },
              lastActiveAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              status: {
                type: 'string',
                enum: ['online', 'away', 'offline'],
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Not a member of this seller' })
  async getPresence(@Param('sellerId') sellerId: string) {
    const presences = await this.presenceService.getPresenceList(sellerId);
    return { presences };
  }
}
