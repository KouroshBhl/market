/**
 * Seller Key Pools Controller
 *
 * SECURITY FIX (2026-02-10): All key pool routes now require:
 *   1. AuthGuard — JWT Bearer token
 *   2. SellerMemberGuard — validates user is ACTIVE member of :sellerId org
 *   3. SellerPermissionGuard — checks RBAC permission
 *
 * sellerId is ALWAYS derived from `request.sellerMember.sellerId`.
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
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
import { AuthGuard } from '../auth/auth.guard';
import { SellerMemberGuard } from '../auth/seller-member.guard';
import { SellerPermissionGuard } from '../auth/seller-permission.guard';
import { RequireSellerPermission } from '../auth/seller-permission.decorator';
import { KeyPoolsService } from './key-pools.service';
import {
  CreateKeyPoolDto,
  UploadKeysDto,
  UploadKeysResponseDto,
  ListKeysQueryDto,
  ListKeysResponseDto,
  EditKeyDto,
  EditKeyResponseDto,
  RevealKeyResponseDto,
  KeyPoolStatsDto,
} from './dto';
import type {
  KeyPoolWithCounts,
  InvalidateKeyResponse,
  UploadKeysResponse,
} from '@workspace/contracts';

@ApiTags('Key Pools (Seller)')
@Controller('seller/:sellerId/key-pools')
@UseGuards(AuthGuard, SellerMemberGuard, SellerPermissionGuard)
@ApiBearerAuth()
export class KeyPoolsController {
  constructor(private readonly keyPoolsService: KeyPoolsService) {}

  @Post()
  @RequireSellerPermission('keys.manage')
  @ApiOperation({
    summary: 'Create key pool',
    description: 'Create a key pool for an AUTO_KEY offer. sellerId is from authenticated membership.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiBody({ type: CreateKeyPoolDto })
  @ApiResponse({ status: 201, description: 'Key pool created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or offer is not AUTO_KEY type' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 409, description: 'Key pool already exists for this offer' })
  async createKeyPool(
    @Body() dto: CreateKeyPoolDto,
    @Req() req: any,
  ): Promise<KeyPoolWithCounts> {
    const sellerId = req.sellerMember.sellerId;
    return this.keyPoolsService.createKeyPool(dto.offerId, sellerId);
  }

  @Get(':poolId')
  @ApiOperation({
    summary: 'Get key pool',
    description: 'Get key pool details with key counts. Only pool owner can access.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'poolId', description: 'Key Pool ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Key pool with counts' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Seller does not own the key pool' })
  @ApiResponse({ status: 404, description: 'Key pool not found' })
  async getKeyPool(
    @Param('poolId') poolId: string,
    @Req() req: any,
  ): Promise<KeyPoolWithCounts> {
    const sellerId = req.sellerMember.sellerId;
    return this.keyPoolsService.getKeyPool(poolId, sellerId);
  }

  @Get('by-offer/:offerId')
  @ApiOperation({
    summary: 'Get key pool by offer ID',
    description: 'Get key pool for a specific offer. Returns null if no pool exists.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'offerId', description: 'Offer ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Key pool with counts, or null if not found' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async getKeyPoolByOffer(
    @Param('offerId') offerId: string,
    @Req() req: any,
  ): Promise<KeyPoolWithCounts | null> {
    const sellerId = req.sellerMember.sellerId;
    return this.keyPoolsService.getKeyPoolByOfferId(offerId, sellerId);
  }

  @Post(':poolId/keys/upload')
  @RequireSellerPermission('keys.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload keys',
    description: 'Bulk upload keys to a pool. Duplicates are detected and silently skipped.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'poolId', description: 'Key Pool ID (UUID)', type: String })
  @ApiBody({ type: UploadKeysDto })
  @ApiResponse({ status: 200, description: 'Upload results', type: UploadKeysResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Key pool not found' })
  async uploadKeys(
    @Param('poolId') poolId: string,
    @Body() dto: UploadKeysDto,
    @Req() req: any,
  ): Promise<UploadKeysResponse> {
    const sellerId = req.sellerMember.sellerId;
    return this.keyPoolsService.uploadKeys(poolId, sellerId, dto.keys, dto.rawText);
  }

  @Get(':poolId/keys')
  @ApiOperation({
    summary: 'List keys',
    description: 'List keys in a pool with pagination. Returns masked key codes.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'poolId', description: 'Key Pool ID (UUID)', type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['AVAILABLE', 'RESERVED', 'DELIVERED', 'INVALID'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of keys', type: ListKeysResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async listKeys(
    @Param('poolId') poolId: string,
    @Query() query: ListKeysQueryDto,
    @Req() req: any,
  ): Promise<ListKeysResponseDto> {
    const sellerId = req.sellerMember.sellerId;
    return this.keyPoolsService.listKeys(
      poolId,
      sellerId,
      query.status,
      query.page ?? 1,
      query.pageSize ?? 50,
    );
  }

  @Get(':poolId/stats')
  @ApiOperation({
    summary: 'Get key pool statistics',
    description: 'Get counts of keys by status.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'poolId', description: 'Key Pool ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Key pool statistics', type: KeyPoolStatsDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async getKeyPoolStats(
    @Param('poolId') poolId: string,
    @Req() req: any,
  ): Promise<KeyPoolStatsDto> {
    const sellerId = req.sellerMember.sellerId;
    return this.keyPoolsService.getKeyPoolStats(poolId, sellerId);
  }

  @Patch(':poolId/keys/:keyId')
  @RequireSellerPermission('keys.manage')
  @ApiOperation({
    summary: 'Edit key',
    description: 'Update a key code. Only AVAILABLE keys without an associated order can be edited.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'poolId', description: 'Key Pool ID (UUID)', type: String })
  @ApiParam({ name: 'keyId', description: 'Key ID (UUID)', type: String })
  @ApiBody({ type: EditKeyDto })
  @ApiResponse({ status: 200, description: 'Key updated', type: EditKeyResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 409, description: 'Duplicate key code' })
  async editKey(
    @Param('poolId') poolId: string,
    @Param('keyId') keyId: string,
    @Body() dto: EditKeyDto,
    @Req() req: any,
  ): Promise<EditKeyResponseDto> {
    const sellerId = req.sellerMember.sellerId;
    return this.keyPoolsService.editKey(poolId, keyId, sellerId, dto.code);
  }

  @Post(':poolId/keys/:keyId/reveal')
  @RequireSellerPermission('keys.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reveal key (seller-only)',
    description: 'Decrypt and return the raw key code. Only AVAILABLE or INVALID keys can be revealed.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'poolId', description: 'Key Pool ID (UUID)', type: String })
  @ApiParam({ name: 'keyId', description: 'Key ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Decrypted key code', type: RevealKeyResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async revealKey(
    @Param('poolId') poolId: string,
    @Param('keyId') keyId: string,
    @Req() req: any,
  ): Promise<RevealKeyResponseDto> {
    const sellerId = req.sellerMember.sellerId;
    return this.keyPoolsService.revealKey(poolId, keyId, sellerId);
  }

  @Delete(':poolId/keys/:keyId')
  @RequireSellerPermission('keys.manage')
  @ApiOperation({
    summary: 'Invalidate key',
    description: 'Mark a key as INVALID (soft delete). Only AVAILABLE keys can be invalidated.',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID (UUID)', type: String })
  @ApiParam({ name: 'poolId', description: 'Key Pool ID (UUID)', type: String })
  @ApiParam({ name: 'keyId', description: 'Key ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Key invalidated successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async invalidateKey(
    @Param('poolId') poolId: string,
    @Param('keyId') keyId: string,
    @Req() req: any,
  ): Promise<InvalidateKeyResponse> {
    const sellerId = req.sellerMember.sellerId;
    return this.keyPoolsService.invalidateKey(poolId, keyId, sellerId);
  }
}
