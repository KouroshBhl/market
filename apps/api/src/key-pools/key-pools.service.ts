import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import { CryptoService } from '../crypto/crypto.service';
import type {
  KeyPoolWithCounts,
  UploadKeysResponse,
  InvalidateKeyResponse,
  AvailabilityStatus,
} from '@workspace/contracts';
import type {
  ListKeysResponseDto,
  KeyListItemDto,
  EditKeyResponseDto,
  RevealKeyResponseDto,
  KeyPoolStatsDto,
} from './dto';

// Constants for key validation
const MIN_KEY_LENGTH = 1;
const MAX_KEY_LENGTH = 500;

@Injectable()
export class KeyPoolsService {
  private readonly logger = new Logger(KeyPoolsService.name);

  constructor(private readonly cryptoService: CryptoService) {}

  /**
   * Create a key pool for an offer
   */
  async createKeyPool(offerId: string, sellerId: string): Promise<KeyPoolWithCounts> {
    // Verify offer exists and belongs to seller
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { keyPool: true },
    });

    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    if (offer.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this offer');
    }

    if (offer.deliveryType !== 'AUTO_KEY') {
      throw new BadRequestException('Key pools are only for AUTO_KEY delivery type');
    }

    // Check if pool already exists
    if (offer.keyPool) {
      throw new ConflictException('Key pool already exists for this offer');
    }

    // Create key pool
    const keyPool = await prisma.keyPool.create({
      data: {
        offerId,
        sellerId,
        isActive: true,
      },
    });

    return this.mapKeyPoolWithCounts(keyPool, {
      available: 0,
      reserved: 0,
      delivered: 0,
      invalid: 0,
      total: 0,
    });
  }

  /**
   * Get key pool by ID with counts
   */
  async getKeyPool(poolId: string, sellerId: string): Promise<KeyPoolWithCounts> {
    const keyPool = await prisma.keyPool.findUnique({
      where: { id: poolId },
    });

    if (!keyPool) {
      throw new NotFoundException(`Key pool with ID ${poolId} not found`);
    }

    if (keyPool.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this key pool');
    }

    const counts = await this.getKeyCounts(poolId);
    return this.mapKeyPoolWithCounts(keyPool, counts);
  }

  /**
   * Get key pool by offer ID with counts
   */
  async getKeyPoolByOfferId(offerId: string, sellerId: string): Promise<KeyPoolWithCounts | null> {
    const keyPool = await prisma.keyPool.findUnique({
      where: { offerId },
    });

    if (!keyPool) {
      return null;
    }

    if (keyPool.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this key pool');
    }

    const counts = await this.getKeyCounts(keyPool.id);
    return this.mapKeyPoolWithCounts(keyPool, counts);
  }

  /**
   * Upload keys to a pool (bulk)
   * Supports both array of keys and raw text (newline-separated)
   */
  async uploadKeys(
    poolId: string,
    sellerId: string,
    keys?: string[],
    rawText?: string,
  ): Promise<UploadKeysResponse> {
    const keyPool = await prisma.keyPool.findUnique({
      where: { id: poolId },
    });

    if (!keyPool) {
      throw new NotFoundException(`Key pool with ID ${poolId} not found`);
    }

    if (keyPool.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this key pool');
    }

    if (!keyPool.isActive) {
      throw new BadRequestException('Key pool is not active');
    }

    // Parse rawText into keys array if provided
    let keyList: string[] = keys || [];
    if (rawText) {
      const parsedKeys = rawText
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      keyList = [...keyList, ...parsedKeys];
    }

    if (keyList.length === 0) {
      throw new BadRequestException('No keys provided');
    }

    let added = 0;
    let duplicates = 0;
    let invalid = 0;

    // Process keys in batches to avoid memory issues
    const keysToInsert: { poolId: string; codeEncrypted: string; codeHash: string }[] = [];
    const seenHashes = new Set<string>();

    for (const keyCode of keyList) {
      // Validate key
      const trimmedKey = keyCode.trim();
      if (!trimmedKey || trimmedKey.length < MIN_KEY_LENGTH || trimmedKey.length > MAX_KEY_LENGTH) {
        invalid++;
        continue;
      }

      const codeHash = this.cryptoService.hash(trimmedKey);

      // Check for duplicates in current batch
      if (seenHashes.has(codeHash)) {
        duplicates++;
        continue;
      }
      seenHashes.add(codeHash);

      // Check for duplicates (existing in DB - global uniqueness)
      const existingKey = await prisma.key.findUnique({
        where: { codeHash },
      });

      if (existingKey) {
        duplicates++;
        continue;
      }

      const codeEncrypted = this.cryptoService.encrypt(trimmedKey);
      keysToInsert.push({
        poolId,
        codeEncrypted,
        codeHash,
      });
    }

    // Bulk insert keys and create audit logs in a transaction
    if (keysToInsert.length > 0) {
      await prisma.$transaction(async (tx) => {
        const result = await tx.key.createMany({
          data: keysToInsert,
          skipDuplicates: true,
        });
        added = result.count;

        // Get the inserted keys for audit logging
        const insertedKeys = await tx.key.findMany({
          where: {
            poolId,
            codeHash: { in: keysToInsert.map((k) => k.codeHash) },
          },
          select: { id: true },
        });

        // Create audit logs for uploaded keys
        if (insertedKeys.length > 0) {
          await tx.keyAuditLog.createMany({
            data: insertedKeys.map((key) => ({
              keyId: key.id,
              poolId,
              sellerId,
              action: 'UPLOAD' as const,
            })),
          });
        }
      });

      this.logger.log(`Seller ${sellerId} uploaded ${added} keys to pool ${poolId}`);
    }

    // Get updated available count
    const availableCount = await prisma.key.count({
      where: { poolId, status: 'AVAILABLE' },
    });

    return {
      added,
      duplicates,
      invalid,
      totalAvailable: availableCount,
    };
  }

  /**
   * List keys in a pool with pagination and filtering
   * Returns masked codes only (last 4 characters visible)
   */
  async listKeys(
    poolId: string,
    sellerId: string,
    status?: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<ListKeysResponseDto> {
    const keyPool = await prisma.keyPool.findUnique({
      where: { id: poolId },
    });

    if (!keyPool) {
      throw new NotFoundException(`Key pool with ID ${poolId} not found`);
    }

    if (keyPool.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this key pool');
    }

    const where: any = { poolId };
    if (status) {
      where.status = status;
    }

    const [keys, total] = await Promise.all([
      prisma.key.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          codeEncrypted: true,
          status: true,
          createdAt: true,
          reservedAt: true,
          deliveredAt: true,
        },
      }),
      prisma.key.count({ where }),
    ]);

    // Map keys to masked format
    const keyItems: KeyListItemDto[] = keys.map((key) => ({
      id: key.id,
      maskedCode: this.maskCode(this.cryptoService.decrypt(key.codeEncrypted)),
      status: key.status,
      createdAt: key.createdAt.toISOString(),
      reservedAt: key.reservedAt?.toISOString() ?? null,
      deliveredAt: key.deliveredAt?.toISOString() ?? null,
    }));

    return {
      keys: keyItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get key pool statistics
   */
  async getKeyPoolStats(poolId: string, sellerId: string): Promise<KeyPoolStatsDto> {
    const keyPool = await prisma.keyPool.findUnique({
      where: { id: poolId },
    });

    if (!keyPool) {
      throw new NotFoundException(`Key pool with ID ${poolId} not found`);
    }

    if (keyPool.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this key pool');
    }

    return this.getKeyCounts(poolId);
  }

  /**
   * Edit a key's code (only AVAILABLE keys without orders)
   */
  async editKey(
    poolId: string,
    keyId: string,
    sellerId: string,
    newCode: string,
  ): Promise<EditKeyResponseDto> {
    const keyPool = await prisma.keyPool.findUnique({
      where: { id: poolId },
    });

    if (!keyPool) {
      throw new NotFoundException(`Key pool with ID ${poolId} not found`);
    }

    if (keyPool.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this key pool');
    }

    const key = await prisma.key.findFirst({
      where: { id: keyId, poolId },
    });

    if (!key) {
      throw new NotFoundException(`Key with ID ${keyId} not found in this pool`);
    }

    // Validate that key can be edited
    if (key.status !== 'AVAILABLE') {
      throw new BadRequestException(
        `Cannot edit key with status ${key.status}. Only AVAILABLE keys can be edited.`,
      );
    }

    if (key.orderId) {
      throw new BadRequestException('Cannot edit key that is tied to an order');
    }

    // Validate new code
    const trimmedCode = newCode.trim();
    if (trimmedCode.length < MIN_KEY_LENGTH || trimmedCode.length > MAX_KEY_LENGTH) {
      throw new BadRequestException(
        `Key code must be between ${MIN_KEY_LENGTH} and ${MAX_KEY_LENGTH} characters`,
      );
    }

    const newCodeHash = this.cryptoService.hash(trimmedCode);

    // Check for duplicate (if same hash, it's the same key - allow)
    if (newCodeHash !== key.codeHash) {
      const existingKey = await prisma.key.findUnique({
        where: { codeHash: newCodeHash },
      });

      if (existingKey) {
        // Don't reveal which key is duplicate
        throw new ConflictException('This key code already exists');
      }
    }

    const newCodeEncrypted = this.cryptoService.encrypt(trimmedCode);
    const oldCodeHash = key.codeHash;

    // Update key and create audit log in transaction
    await prisma.$transaction(async (tx) => {
      await tx.key.update({
        where: { id: keyId },
        data: {
          codeEncrypted: newCodeEncrypted,
          codeHash: newCodeHash,
        },
      });

      await tx.keyAuditLog.create({
        data: {
          keyId,
          poolId,
          sellerId,
          action: 'EDIT',
          metadata: { oldCodeHash }, // Store old hash for audit trail
        },
      });
    });

    this.logger.log(`Seller ${sellerId} edited key ${keyId} in pool ${poolId}`);

    return {
      success: true,
      keyId,
      maskedCode: this.maskCode(trimmedCode),
    };
  }

  /**
   * Reveal a key's raw code (seller-only, AVAILABLE or INVALID keys)
   * Policy: We allow revealing AVAILABLE and INVALID keys.
   * DELIVERED keys are not revealed to prevent seller from having access
   * to keys that have already been sold (buyer owns them now).
   * RESERVED keys are in-flight and should not be revealed.
   */
  async revealKey(
    poolId: string,
    keyId: string,
    sellerId: string,
  ): Promise<RevealKeyResponseDto> {
    const keyPool = await prisma.keyPool.findUnique({
      where: { id: poolId },
    });

    if (!keyPool) {
      throw new NotFoundException(`Key pool with ID ${poolId} not found`);
    }

    if (keyPool.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this key pool');
    }

    const key = await prisma.key.findFirst({
      where: { id: keyId, poolId },
    });

    if (!key) {
      throw new NotFoundException(`Key with ID ${keyId} not found in this pool`);
    }

    // Only allow revealing AVAILABLE or INVALID keys
    // DELIVERED: buyer owns the key now, seller should not have access
    // RESERVED: in-flight, should not be revealed
    if (key.status !== 'AVAILABLE' && key.status !== 'INVALID') {
      throw new BadRequestException(
        `Cannot reveal key with status ${key.status}. Only AVAILABLE or INVALID keys can be revealed.`,
      );
    }

    const decryptedCode = this.cryptoService.decrypt(key.codeEncrypted);

    // Create audit log for reveal action
    await prisma.keyAuditLog.create({
      data: {
        keyId,
        poolId,
        sellerId,
        action: 'REVEAL',
      },
    });

    this.logger.log(`Seller ${sellerId} revealed key ${keyId} in pool ${poolId}`);

    return {
      code: decryptedCode,
      keyId,
      status: key.status,
    };
  }

  /**
   * Mask a key code, showing only the last 4 characters
   */
  private maskCode(code: string): string {
    if (code.length <= 4) {
      return '****';
    }
    return '****' + code.slice(-4);
  }

  /**
   * Invalidate a key (soft delete)
   * Only AVAILABLE keys can be invalidated.
   * RESERVED and DELIVERED keys cannot be invalidated.
   */
  async invalidateKey(
    poolId: string,
    keyId: string,
    sellerId: string,
  ): Promise<InvalidateKeyResponse> {
    const keyPool = await prisma.keyPool.findUnique({
      where: { id: poolId },
    });

    if (!keyPool) {
      throw new NotFoundException(`Key pool with ID ${poolId} not found`);
    }

    if (keyPool.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this key pool');
    }

    const key = await prisma.key.findFirst({
      where: { id: keyId, poolId },
    });

    if (!key) {
      throw new NotFoundException(`Key with ID ${keyId} not found in this pool`);
    }

    // Block invalidation for RESERVED or DELIVERED keys
    if (key.status === 'RESERVED') {
      throw new BadRequestException(
        'Cannot invalidate key with status RESERVED. The key is pending delivery.',
      );
    }

    if (key.status === 'DELIVERED') {
      throw new BadRequestException(
        'Cannot invalidate key with status DELIVERED. The key has already been sold.',
      );
    }

    if (key.status === 'INVALID') {
      throw new BadRequestException('Key is already invalidated.');
    }

    // Update key and create audit log in transaction
    const updatedKey = await prisma.$transaction(async (tx) => {
      const updated = await tx.key.update({
        where: { id: keyId },
        data: { status: 'INVALID' },
      });

      await tx.keyAuditLog.create({
        data: {
          keyId,
          poolId,
          sellerId,
          action: 'INVALIDATE',
        },
      });

      return updated;
    });

    this.logger.log(`Seller ${sellerId} invalidated key ${keyId} in pool ${poolId}`);

    return {
      success: true,
      keyId: updatedKey.id,
      newStatus: updatedKey.status,
    };
  }

  /**
   * Get key counts for a pool
   */
  async getKeyCounts(poolId: string): Promise<{
    available: number;
    reserved: number;
    delivered: number;
    invalid: number;
    total: number;
  }> {
    const counts = await prisma.key.groupBy({
      by: ['status'],
      where: { poolId },
      _count: { status: true },
    });

    const result = {
      available: 0,
      reserved: 0,
      delivered: 0,
      invalid: 0,
      total: 0,
    };

    for (const count of counts) {
      const statusKey = count.status.toLowerCase() as keyof typeof result;
      if (statusKey in result) {
        result[statusKey] = count._count.status;
      }
      result.total += count._count.status;
    }

    return result;
  }

  /**
   * Get availability count for an offer (for public/buyer view)
   */
  async getOfferAvailability(offerId: string): Promise<{
    availableCount: number;
    availability: AvailabilityStatus;
  }> {
    const keyPool = await prisma.keyPool.findUnique({
      where: { offerId },
    });

    if (!keyPool || !keyPool.isActive) {
      return { availableCount: 0, availability: 'out_of_stock' };
    }

    const availableCount = await prisma.key.count({
      where: { poolId: keyPool.id, status: 'AVAILABLE' },
    });

    return {
      availableCount,
      availability: availableCount > 0 ? 'in_stock' : 'out_of_stock',
    };
  }

  /**
   * Reserve a key atomically (for order fulfillment)
   * Uses FOR UPDATE SKIP LOCKED for safe concurrent access
   */
  async reserveKey(poolId: string, orderId: string): Promise<string | null> {
    // Use raw SQL for atomic reservation with row-level locking
    const result = await prisma.$queryRaw<{ id: string; code_encrypted: string }[]>`
      UPDATE keys
      SET status = 'RESERVED'::"KeyStatus",
          reserved_at = NOW(),
          order_id = ${orderId}::uuid,
          updated_at = NOW()
      WHERE id = (
        SELECT id FROM keys
        WHERE pool_id = ${poolId}::uuid
          AND status = 'AVAILABLE'::"KeyStatus"
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, code_encrypted
    `;

    if (result.length === 0) {
      return null; // No available keys
    }

    // Decrypt and return the key code
    return this.cryptoService.decrypt(result[0].code_encrypted);
  }

  /**
   * Mark a reserved key as delivered
   */
  async deliverKey(keyId: string, orderId: string): Promise<void> {
    await prisma.key.update({
      where: { id: keyId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
    });
  }

  /**
   * Get the delivered key for an order (buyer retrieval)
   */
  async getDeliveredKeyForOrder(orderId: string): Promise<string | null> {
    const key = await prisma.key.findFirst({
      where: { orderId, status: 'DELIVERED' },
    });

    if (!key) {
      return null;
    }

    return this.cryptoService.decrypt(key.codeEncrypted);
  }

  /**
   * Helper: Map key pool to contract with counts
   */
  private mapKeyPoolWithCounts(
    keyPool: any,
    counts: {
      available: number;
      reserved: number;
      delivered: number;
      invalid: number;
      total: number;
    },
  ): KeyPoolWithCounts {
    return {
      id: keyPool.id,
      offerId: keyPool.offerId,
      sellerId: keyPool.sellerId,
      isActive: keyPool.isActive,
      createdAt: keyPool.createdAt.toISOString(),
      updatedAt: keyPool.updatedAt.toISOString(),
      counts,
    };
  }
}
