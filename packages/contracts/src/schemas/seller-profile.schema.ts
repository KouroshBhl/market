import { z } from 'zod';

// ============================================
// SELLER PROFILE / STORE IDENTITY
// ============================================

// ---------- Support Response Time ----------

export const SupportResponseTimeSchema = z.enum([
  'UNDER_15_MIN',
  'UNDER_1_HOUR',
  'UNDER_24_HOURS',
]);
export type SupportResponseTime = z.infer<typeof SupportResponseTimeSchema>;

// ---------- Store Identity (Full Seller Profile) ----------

export const StoreIdentitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  slug: z.string(),
  displayName: z.string(),
  logoUrl: z.string().nullable(),
  bio: z.string().nullable(),
  supportResponseTime: SupportResponseTimeSchema.nullable(),
  timezone: z.string().nullable(),
  languages: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StoreIdentity = z.infer<typeof StoreIdentitySchema>;

// ============================================
// Request / Response Schemas
// ============================================

// GET /seller/:sellerId/settings/identity
export const GetStoreIdentityResponseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  displayName: z.string(),
  logoUrl: z.string().nullable(),
  bio: z.string().nullable(),
  supportResponseTime: SupportResponseTimeSchema.nullable(),
  timezone: z.string().nullable(),
  languages: z.array(z.string()),
});

export type GetStoreIdentityResponse = z.infer<typeof GetStoreIdentityResponseSchema>;

// PATCH /seller/:sellerId/settings/identity
export const UpdateStoreIdentityRequestSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().nullable().optional(),
  bio: z.string().max(300).nullable().optional(),
  supportResponseTime: SupportResponseTimeSchema.nullable().optional(),
  timezone: z.string().nullable().optional(),
  languages: z.array(z.string()).optional(),
});

export type UpdateStoreIdentityRequest = z.infer<typeof UpdateStoreIdentityRequestSchema>;

export const UpdateStoreIdentityResponseSchema = z.object({
  success: z.boolean(),
  profile: GetStoreIdentityResponseSchema,
});

export type UpdateStoreIdentityResponse = z.infer<typeof UpdateStoreIdentityResponseSchema>;
