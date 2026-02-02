import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { prisma } from '@workspace/db';
import { CryptoService } from '../crypto/crypto.service';
import type {
  KeyPoolWithCounts,
  UploadKeysResponse,
  InvalidateKeyResponse,
  AvailabilityStatus,
} from '@workspace/contracts';

@Injectable()
export class KeyPoolsService {
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
   */
  async uploadKeys(
    poolId: string,
    sellerId: string,
    keys: string[],
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

    let added = 0;
    let duplicates = 0;
    let invalid = 0;

    // Process keys in batches to avoid memory issues
    const keysToInsert: { poolId: string; codeEncrypted: string; codeHash: string }[] = [];

    for (const keyCode of keys) {
      // Validate key (basic validation)
      const trimmedKey = keyCode.trim();
      if (!trimmedKey || trimmedKey.length < 1) {
        invalid++;
        continue;
      }

      const codeHash = this.cryptoService.hash(trimmedKey);
      
      // Check for duplicates (existing in DB)
      const existingKey = await prisma.key.findUnique({
        where: { codeHash },
      });

      if (existingKey) {
        duplicates++;
        continue;
      }

      // Check for duplicates in current batch
      if (keysToInsert.some(k => k.codeHash === codeHash)) {
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

    // Bulk insert keys
    if (keysToInsert.length > 0) {
      await prisma.key.createMany({
        data: keysToInsert,
        skipDuplicates: true, // Extra safety
      });
      added = keysToInsert.length;
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
   * Invalidate a key (soft delete)
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

    if (key.status !== 'AVAILABLE') {
      throw new BadRequestException(
        `Cannot invalidate key with status ${key.status}. Only AVAILABLE keys can be invalidated.`,
      );
    }

    const updatedKey = await prisma.key.update({
      where: { id: keyId },
      data: { status: 'INVALID' },
    });

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
