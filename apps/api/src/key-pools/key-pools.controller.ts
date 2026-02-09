import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { EmailVerifiedGuard } from '../auth/email-verified.guard';
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

@ApiTags('Key Pools')
@Controller('key-pools')
export class KeyPoolsController {
  constructor(private readonly keyPoolsService: KeyPoolsService) {}

  @Post()
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create key pool',
    description: 'Create a key pool for an AUTO_KEY offer. One pool per offer.',
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiBody({ type: CreateKeyPoolDto })
  @ApiResponse({
    status: 201,
    description: 'Key pool created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or offer is not AUTO_KEY type',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller does not own the offer',
  })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Key pool already exists for this offer',
  })
  async createKeyPool(
    @Query('sellerId') sellerId: string,
    @Body() dto: CreateKeyPoolDto,
  ): Promise<KeyPoolWithCounts> {
    return this.keyPoolsService.createKeyPool(dto.offerId, sellerId);
  }

  @Get(':poolId')
  @ApiOperation({
    summary: 'Get key pool',
    description: 'Get key pool details with key counts. Only pool owner can access.',
  })
  @ApiParam({
    name: 'poolId',
    description: 'Key Pool ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Key pool with counts',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller does not own the key pool',
  })
  @ApiResponse({
    status: 404,
    description: 'Key pool not found',
  })
  async getKeyPool(
    @Param('poolId') poolId: string,
    @Query('sellerId') sellerId: string,
  ): Promise<KeyPoolWithCounts> {
    return this.keyPoolsService.getKeyPool(poolId, sellerId);
  }

  @Get('by-offer/:offerId')
  @ApiOperation({
    summary: 'Get key pool by offer ID',
    description: 'Get key pool for a specific offer. Returns null if no pool exists.',
  })
  @ApiParam({
    name: 'offerId',
    description: 'Offer ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Key pool with counts, or null if not found',
  })
  async getKeyPoolByOffer(
    @Param('offerId') offerId: string,
    @Query('sellerId') sellerId: string,
  ): Promise<KeyPoolWithCounts | null> {
    return this.keyPoolsService.getKeyPoolByOfferId(offerId, sellerId);
  }

  @Post(':poolId/keys/upload')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload keys',
    description:
      'Bulk upload keys to a pool. Accepts either an array of keys or raw text (newline-separated). ' +
      'Keys are encrypted at rest. Duplicates are detected and silently skipped. ' +
      'Returns only aggregate counts without revealing which keys were duplicates.',
  })
  @ApiParam({
    name: 'poolId',
    description: 'Key Pool ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiBody({ type: UploadKeysDto })
  @ApiResponse({
    status: 200,
    description: 'Upload results with counts of added, duplicates, and invalid keys',
    type: UploadKeysResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or pool is not active',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller does not own the key pool',
  })
  @ApiResponse({
    status: 404,
    description: 'Key pool not found',
  })
  async uploadKeys(
    @Param('poolId') poolId: string,
    @Query('sellerId') sellerId: string,
    @Body() dto: UploadKeysDto,
  ): Promise<UploadKeysResponse> {
    return this.keyPoolsService.uploadKeys(poolId, sellerId, dto.keys, dto.rawText);
  }

  @Get(':poolId/keys')
  @ApiOperation({
    summary: 'List keys',
    description:
      'List keys in a pool with pagination and optional status filter. ' +
      'Returns masked key codes (last 4 characters visible) for security. ' +
      'Raw key codes are never exposed in list responses.',
  })
  @ApiParam({
    name: 'poolId',
    description: 'Key Pool ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by key status',
    enum: ['AVAILABLE', 'RESERVED', 'DELIVERED', 'INVALID'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-indexed)',
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Items per page (max 100)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of keys with masked codes',
    type: ListKeysResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Seller does not own the key pool',
  })
  @ApiResponse({
    status: 404,
    description: 'Key pool not found',
  })
  async listKeys(
    @Param('poolId') poolId: string,
    @Query() query: ListKeysQueryDto,
  ): Promise<ListKeysResponseDto> {
    return this.keyPoolsService.listKeys(
      poolId,
      query.sellerId!,
      query.status,
      query.page ?? 1,
      query.pageSize ?? 50,
    );
  }

  @Get(':poolId/stats')
  @ApiOperation({
    summary: 'Get key pool statistics',
    description: 'Get counts of keys by status (available, reserved, delivered, invalid, total).',
  })
  @ApiParam({
    name: 'poolId',
    description: 'Key Pool ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Key pool statistics',
    type: KeyPoolStatsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Seller does not own the key pool',
  })
  @ApiResponse({
    status: 404,
    description: 'Key pool not found',
  })
  async getKeyPoolStats(
    @Param('poolId') poolId: string,
    @Query('sellerId') sellerId: string,
  ): Promise<KeyPoolStatsDto> {
    return this.keyPoolsService.getKeyPoolStats(poolId, sellerId);
  }

  @Patch(':poolId/keys/:keyId')
  @ApiOperation({
    summary: 'Edit key',
    description:
      'Update a key code. Only AVAILABLE keys without an associated order can be edited. ' +
      'The new code is encrypted and its hash is checked for uniqueness.',
  })
  @ApiParam({
    name: 'poolId',
    description: 'Key Pool ID (UUID)',
    type: String,
  })
  @ApiParam({
    name: 'keyId',
    description: 'Key ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiBody({ type: EditKeyDto })
  @ApiResponse({
    status: 200,
    description: 'Key updated successfully',
    type: EditKeyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Key cannot be edited (not AVAILABLE or tied to order)',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller does not own the key pool',
  })
  @ApiResponse({
    status: 404,
    description: 'Key pool or key not found',
  })
  @ApiResponse({
    status: 409,
    description: 'New key code already exists (duplicate)',
  })
  async editKey(
    @Param('poolId') poolId: string,
    @Param('keyId') keyId: string,
    @Query('sellerId') sellerId: string,
    @Body() dto: EditKeyDto,
  ): Promise<EditKeyResponseDto> {
    return this.keyPoolsService.editKey(poolId, keyId, sellerId, dto.code);
  }

  @Post(':poolId/keys/:keyId/reveal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reveal key (seller-only)',
    description:
      'Decrypt and return the raw key code. Only AVAILABLE or INVALID keys can be revealed. ' +
      'DELIVERED keys cannot be revealed as they now belong to the buyer. ' +
      'RESERVED keys are in-flight and cannot be revealed. ' +
      'This action is logged for audit purposes.',
  })
  @ApiParam({
    name: 'poolId',
    description: 'Key Pool ID (UUID)',
    type: String,
  })
  @ApiParam({
    name: 'keyId',
    description: 'Key ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Decrypted key code',
    type: RevealKeyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Key cannot be revealed (RESERVED or DELIVERED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller does not own the key pool',
  })
  @ApiResponse({
    status: 404,
    description: 'Key pool or key not found',
  })
  async revealKey(
    @Param('poolId') poolId: string,
    @Param('keyId') keyId: string,
    @Query('sellerId') sellerId: string,
  ): Promise<RevealKeyResponseDto> {
    return this.keyPoolsService.revealKey(poolId, keyId, sellerId);
  }

  @Delete(':poolId/keys/:keyId')
  @ApiOperation({
    summary: 'Invalidate key',
    description: 'Mark a key as INVALID (soft delete). Only AVAILABLE keys can be invalidated.',
  })
  @ApiParam({
    name: 'poolId',
    description: 'Key Pool ID (UUID)',
    type: String,
  })
  @ApiParam({
    name: 'keyId',
    description: 'Key ID (UUID)',
    type: String,
  })
  @ApiQuery({
    name: 'sellerId',
    required: true,
    description: 'Seller ID (UUID) - will be from auth in production',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Key invalidated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Key is not in AVAILABLE status',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller does not own the key pool',
  })
  @ApiResponse({
    status: 404,
    description: 'Key pool or key not found',
  })
  async invalidateKey(
    @Param('poolId') poolId: string,
    @Param('keyId') keyId: string,
    @Query('sellerId') sellerId: string,
  ): Promise<InvalidateKeyResponse> {
    return this.keyPoolsService.invalidateKey(poolId, keyId, sellerId);
  }
}
