import { z } from 'zod';

// ============================================
// KEY POOL - Auto-Key Delivery System
// ============================================

export const KeyStatusSchema = z.enum(['AVAILABLE', 'RESERVED', 'DELIVERED', 'INVALID']);
export type KeyStatus = z.infer<typeof KeyStatusSchema>;

// Key Pool (seller view - no raw keys exposed)
export const KeyPoolSchema = z.object({
  id: z.string().uuid(),
  offerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type KeyPool = z.infer<typeof KeyPoolSchema>;

// Key Pool with counts (seller view)
export const KeyPoolWithCountsSchema = KeyPoolSchema.extend({
  counts: z.object({
    available: z.number().int(),
    reserved: z.number().int(),
    delivered: z.number().int(),
    invalid: z.number().int(),
    total: z.number().int(),
  }),
});

export type KeyPoolWithCounts = z.infer<typeof KeyPoolWithCountsSchema>;

// POST /key-pools - Create key pool for offer
export const CreateKeyPoolSchema = z.object({
  offerId: z.string().uuid(),
});

export type CreateKeyPool = z.infer<typeof CreateKeyPoolSchema>;

// POST /key-pools/:poolId/keys/upload - Bulk upload keys
export const UploadKeysSchema = z.object({
  keys: z.array(z.string().min(1).max(500)), // Array of key codes
});

export type UploadKeys = z.infer<typeof UploadKeysSchema>;

// Response for key upload
export const UploadKeysResponseSchema = z.object({
  added: z.number().int(),
  duplicates: z.number().int(),
  invalid: z.number().int(),
  totalAvailable: z.number().int(),
});

export type UploadKeysResponse = z.infer<typeof UploadKeysResponseSchema>;

// Key metadata (seller view - no raw code exposed)
export const KeyMetadataSchema = z.object({
  id: z.string().uuid(),
  status: KeyStatusSchema,
  reservedAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  orderId: z.string().uuid().nullable(),
  createdAt: z.string(),
});

export type KeyMetadata = z.infer<typeof KeyMetadataSchema>;

// GET /key-pools/:poolId response
export const GetKeyPoolResponseSchema = KeyPoolWithCountsSchema;
export type GetKeyPoolResponse = z.infer<typeof GetKeyPoolResponseSchema>;

// DELETE /key-pools/:poolId/keys/:keyId - Mark key as invalid
export const InvalidateKeyResponseSchema = z.object({
  success: z.boolean(),
  keyId: z.string().uuid(),
  newStatus: KeyStatusSchema,
});

export type InvalidateKeyResponse = z.infer<typeof InvalidateKeyResponseSchema>;

// Availability status (derived, not stored)
export const AvailabilityStatusSchema = z.enum(['in_stock', 'out_of_stock']);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>;
