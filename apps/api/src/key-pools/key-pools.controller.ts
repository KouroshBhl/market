import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { KeyPoolsService } from './key-pools.service';
import { CreateKeyPoolDto, UploadKeysDto } from './dto';
import type {
  KeyPoolWithCounts,
  UploadKeysResponse,
  InvalidateKeyResponse,
} from '@workspace/contracts';

@ApiTags('Key Pools')
@Controller('key-pools')
export class KeyPoolsController {
  constructor(private readonly keyPoolsService: KeyPoolsService) {}

  @Post()
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload keys',
    description: 'Bulk upload keys to a pool. Keys are encrypted at rest. Duplicates are detected and skipped.',
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
    return this.keyPoolsService.uploadKeys(poolId, sellerId, dto.keys);
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
