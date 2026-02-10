import { z } from 'zod';
import type { ApiContract } from '../base';

const PublicOfferSchema = z.object({
  id: z.string().uuid(),
  sellerId: z.string().uuid(),
  sellerName: z.string(),
  deliveryType: z.enum(['AUTO_KEY', 'MANUAL']),
  priceAmountCents: z.number().int(),
  currency: z.string(),
  estimatedDeliveryMinutes: z.number().int().nullable(),
  inStock: z.boolean(),
  publishedAt: z.string().nullable(),
}).openapi('PublicOffer');

const GetPublicOffersByVariantResponseSchema = z.object({
  offers: z.array(PublicOfferSchema),
  platformFeeBps: z.number().int(),
}).openapi('GetPublicOffersByVariantResponse');

export const getPublicOffersByVariantContract = {
  method: 'get',
  path: '/public/offers/by-variant/:variantId',
  tags: ['Public Offers'],
  summary: 'Get active offers for a variant (buyer-facing)',
  description:
    'Returns all active, in-stock offers for a given catalog variant. Includes seller display name, delivery type, pricing, and availability. Used by the buyer product page.',

  request: {
    params: z.object({
      variantId: z.string().uuid().openapi({ example: '10000000-0000-0000-0000-000000000001' }),
    }),
  },

  responses: {
    200: {
      description: 'List of active offers for the variant',
      schema: GetPublicOffersByVariantResponseSchema,
    },
  },
} as const satisfies ApiContract;

export type PublicOffer = z.infer<typeof PublicOfferSchema>;
export type GetPublicOffersByVariantResponse = z.infer<typeof GetPublicOffersByVariantResponseSchema>;
