import { z } from 'zod';

// ============================================
// SELLER PROFILE / STORE IDENTITY
// ============================================
// Public store identity = slug (the URL handle).
// sellerDisplayName = internal name for dashboard/team only.
// storeName is REMOVED — slug IS the public identity.

export const StoreIdentitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  slug: z.string(), // This IS the public store identity / handle
  sellerDisplayName: z.string(), // Internal name for dashboard/team
  logoUrl: z.string().nullable(),
  bio: z.string().nullable(),
  timezone: z.string().nullable(),
  slugChangeCount: z.number().int().min(0),
  slugChangedAt: z.string().nullable(),
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
  sellerDisplayName: z.string(),
  logoUrl: z.string().nullable(),
  bio: z.string().nullable(),
  timezone: z.string().nullable(),
  slugChangeCount: z.number().int().min(0),
  slugChangedAt: z.string().nullable(),
  canChangeSlug: z.boolean(), // Computed: slugChangeCount === 0
});

export type GetStoreIdentityResponse = z.infer<typeof GetStoreIdentityResponseSchema>;

// PATCH /seller/:sellerId/settings/identity
export const UpdateStoreIdentityRequestSchema = z.object({
  sellerDisplayName: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  timezone: z.string().nullable().optional(),
});

export type UpdateStoreIdentityRequest = z.infer<typeof UpdateStoreIdentityRequestSchema>;

export const UpdateStoreIdentityResponseSchema = z.object({
  success: z.boolean(),
  profile: GetStoreIdentityResponseSchema,
});

export type UpdateStoreIdentityResponse = z.infer<typeof UpdateStoreIdentityResponseSchema>;

// POST /seller/:sellerId/settings/identity/change-slug
export const ChangeStoreSlugRequestSchema = z.object({
  newSlug: z
    .string()
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be at most 30 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Handle must be lowercase letters, numbers, and single hyphens only (no leading/trailing/consecutive hyphens)',
    )
    .refine(
      (slug) =>
        ![
          'admin', 'api', 'seller', 'settings', 'auth', 'docs',
          'about', 'terms', 'privacy', 'support', 'help', 'store',
          'shop', 'buy', 'checkout', 'cart', 'order', 'orders',
        ].includes(slug),
      'This handle is reserved',
    ),
});

export type ChangeStoreSlugRequest = z.infer<typeof ChangeStoreSlugRequestSchema>;

export const ChangeStoreSlugResponseSchema = z.object({
  success: z.boolean(),
  newSlug: z.string(),
  previousSlug: z.string(),
});

export type ChangeStoreSlugResponse = z.infer<typeof ChangeStoreSlugResponseSchema>;

// GET /public/store/resolve/:slug — resolves slug (current or historical) to current slug
export const ResolveStoreSlugResponseSchema = z.object({
  currentSlug: z.string(),
  sellerId: z.string().uuid(),
  isRedirect: z.boolean(), // true if the requested slug is a historical one
});

export type ResolveStoreSlugResponse = z.infer<typeof ResolveStoreSlugResponseSchema>;
