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
  keys: z.array(z.string().min(1).max(500)).optional(), // Array of key codes
  rawText: z.string().max(500000).optional(), // Raw text with newline-separated keys
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

// Key list item (seller view - masked code only)
export const KeyListItemSchema = z.object({
  id: z.string().uuid(),
  maskedCode: z.string(), // Last 4 characters visible, e.g., "****ABCD"
  status: KeyStatusSchema,
  createdAt: z.string(),
  reservedAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
});

export type KeyListItem = z.infer<typeof KeyListItemSchema>;

// GET /key-pools/:poolId/keys response
export const ListKeysResponseSchema = z.object({
  keys: z.array(KeyListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int(),
});

export type ListKeysResponse = z.infer<typeof ListKeysResponseSchema>;

// Key pool statistics
export const KeyPoolStatsSchema = z.object({
  total: z.number().int(),
  available: z.number().int(),
  reserved: z.number().int(),
  delivered: z.number().int(),
  invalid: z.number().int(),
});

export type KeyPoolStats = z.infer<typeof KeyPoolStatsSchema>;

// PATCH /key-pools/:poolId/keys/:keyId - Edit key
export const EditKeySchema = z.object({
  code: z.string().min(1).max(500),
});

export type EditKey = z.infer<typeof EditKeySchema>;

export const EditKeyResponseSchema = z.object({
  success: z.boolean(),
  keyId: z.string().uuid(),
  maskedCode: z.string(),
});

export type EditKeyResponse = z.infer<typeof EditKeyResponseSchema>;

// POST /key-pools/:poolId/keys/:keyId/reveal - Reveal key
export const RevealKeyResponseSchema = z.object({
  code: z.string(),
  keyId: z.string().uuid(),
  status: KeyStatusSchema,
});

export type RevealKeyResponse = z.infer<typeof RevealKeyResponseSchema>;

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

// Key audit action types
export const KeyAuditActionSchema = z.enum(['UPLOAD', 'EDIT', 'INVALIDATE', 'REVEAL']);
export type KeyAuditAction = z.infer<typeof KeyAuditActionSchema>;

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
