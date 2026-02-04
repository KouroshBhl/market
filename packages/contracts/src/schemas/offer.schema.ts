import { z } from 'zod';
import { DeliveryTypeSchema } from './delivery-type.schema';
import { CurrencySchema } from './currency.schema';
import { CatalogVariantWithProductSchema } from './catalog.schema';
import { AvailabilityStatusSchema } from './key-pool.schema';

// ============================================
// OFFERS - Seller listings
// ============================================

export const OfferStatusSchema = z.enum(['draft', 'active', 'inactive']);
export type OfferStatus = z.infer<typeof OfferStatusSchema>;

// Base Offer
export const OfferSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  variantId: z.string().uuid(),
  status: OfferStatusSchema,
  deliveryType: DeliveryTypeSchema,
  priceAmount: z.number().int(), // Base price (seller receives) in cents
  currency: CurrencySchema,
  stockCount: z.number().int().nullable(), // For MANUAL delivery only
  descriptionMarkdown: z.string().nullable(),
  deliveryInstructions: z.string().nullable(),
  keyPoolId: z.string().uuid().nullable(), // FK to KeyPool for AUTO_KEY
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Derived fields for AUTO_KEY offers
  autoKeyAvailableCount: z.number().int().optional(), // Count of available keys
  availability: AvailabilityStatusSchema.optional(), // in_stock | out_of_stock
  // Computed pricing fields
  buyerPriceAmount: z.number().int().optional(), // Total buyer pays (base + platform fee) in cents
});

export type Offer = z.infer<typeof OfferSchema>;

// Offer with variant + product details
export const OfferWithDetailsSchema = OfferSchema.extend({
  variant: CatalogVariantWithProductSchema,
});

export type OfferWithDetails = z.infer<typeof OfferWithDetailsSchema>;

// POST /offers/draft - Create or update draft
export const SaveOfferDraftSchema = z.object({
  id: z.string().uuid().optional(), // If provided, updates existing draft
  sellerId: z.string().uuid(),
  deliveryType: DeliveryTypeSchema.optional(),
  variantId: z.string().uuid().optional(),
  priceAmount: z.number().int().optional(),
  currency: CurrencySchema.optional(),
  stockCount: z.number().int().nullable().optional(),
  descriptionMarkdown: z.string().max(5000).nullable().optional().transform((v) => (typeof v === 'string' ? v.trim() || null : v)),
  deliveryInstructions: z.string().nullable().optional(),
  keyPoolId: z.string().uuid().nullable().optional(),
});

export type SaveOfferDraft = z.infer<typeof SaveOfferDraftSchema>;

// POST /offers/publish - Publish offer (validate required fields)
export const PublishOfferSchema = z.object({
  sellerId: z.string().uuid(),
  deliveryType: DeliveryTypeSchema,
  variantId: z.string().uuid(),
  priceAmount: z.number().int().positive(),
  currency: CurrencySchema,
  stockCount: z.number().int().nullable().optional(),
  descriptionMarkdown: z.string().max(5000).nullable().optional().transform((v) => (typeof v === 'string' ? v.trim() || null : v)),
  deliveryInstructions: z.string().nullable().optional(),
  keyPoolId: z.string().uuid().nullable().optional(),
});

export type PublishOffer = z.infer<typeof PublishOfferSchema>;

// PATCH /offers/:id - Update offer (pricing, description, etc.)
export const UpdateOfferSchema = z.object({
  priceAmount: z.number().int().positive().optional(),
  currency: CurrencySchema.optional(),
  descriptionMarkdown: z.string().max(5000).nullable().optional().transform((v) => (typeof v === 'string' ? v.trim() || null : v)),
});

export type UpdateOffer = z.infer<typeof UpdateOfferSchema>;

// PATCH /offers/:id/status - Toggle active/inactive
export const UpdateOfferStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

export type UpdateOfferStatus = z.infer<typeof UpdateOfferStatusSchema>;

// GET /seller/offers response
export const GetSellerOffersResponseSchema = z.object({
  offers: z.array(OfferWithDetailsSchema),
});

export type GetSellerOffersResponse = z.infer<typeof GetSellerOffersResponseSchema>;
