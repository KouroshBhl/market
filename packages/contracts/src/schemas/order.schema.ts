import { z } from 'zod';
import { CurrencySchema } from './currency.schema';
import { RequirementsPayloadSchema } from './requirement.schema';

// ============================================
// ORDER - MVP Order System for Key Fulfillment
// ============================================

export const OrderStatusSchema = z.enum(['PENDING', 'PAID', 'FULFILLED', 'CANCELED']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// Base Order
export const OrderSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid(),
  offerId: z.string().uuid(),
  status: OrderStatusSchema,
  priceAmount: z.number().int(),
  currency: CurrencySchema,
  // deliveredKey is NOT included - only returned in fulfill response
  // requirementsPayload is NOT included in base schema - only in seller view
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;

// POST /orders - Create order
export const CreateOrderSchema = z.object({
  buyerId: z.string().uuid(),
  offerId: z.string().uuid(),
  requirementsPayload: RequirementsPayloadSchema.optional(), // Buyer-provided data matching template fields
});

export type CreateOrder = z.infer<typeof CreateOrderSchema>;

// POST /orders/:id/pay - Simulate payment (MVP)
export const PayOrderResponseSchema = z.object({
  success: z.boolean(),
  order: OrderSchema,
});

export type PayOrderResponse = z.infer<typeof PayOrderResponseSchema>;

// POST /orders/:id/fulfill - Fulfill order and deliver key
export const FulfillOrderResponseSchema = z.object({
  success: z.boolean(),
  order: OrderSchema,
  // deliveredKey only present if AUTO_KEY delivery and success
  deliveredKey: z.string().optional(),
  // For MANUAL delivery, return instructions instead
  deliveryInstructions: z.string().optional(),
});

export type FulfillOrderResponse = z.infer<typeof FulfillOrderResponseSchema>;

// GET /orders/:id - Get order details (buyer view)
export const GetOrderResponseSchema = z.object({
  order: OrderSchema,
  // Only show delivered key if order is fulfilled and it's AUTO_KEY
  deliveredKey: z.string().optional(),
  deliveryInstructions: z.string().optional(),
});

export type GetOrderResponse = z.infer<typeof GetOrderResponseSchema>;

// ============================================
// SELLER ORDER VIEW - For manual fulfillment
// ============================================

// Seller view of order with buyer requirements (for manual fulfillment)
export const SellerOrderSchema = OrderSchema.extend({
  // Buyer-provided requirements (sensitive fields masked/decrypted as needed)
  requirementsPayload: RequirementsPayloadSchema.nullable(),
});

export type SellerOrder = z.infer<typeof SellerOrderSchema>;

// GET /seller/orders/:id - Seller order details with requirements
export const GetSellerOrderResponseSchema = z.object({
  order: SellerOrderSchema,
  // Offer details for context
  offer: z.object({
    id: z.string().uuid(),
    deliveryType: z.string(),
    deliveryInstructions: z.string().nullable(),
    estimatedDeliveryMinutes: z.number().int().nullable(),
  }),
  // Template info if requirements were collected
  requirementTemplate: z.object({
    id: z.string().uuid(),
    name: z.string(),
    fields: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.string(),
      sensitive: z.boolean(),
    })),
  }).nullable(),
});

export type GetSellerOrderResponse = z.infer<typeof GetSellerOrderResponseSchema>;

// GET /seller/orders - List seller orders
export const GetSellerOrdersResponseSchema = z.object({
  orders: z.array(SellerOrderSchema.extend({
    offer: z.object({
      id: z.string().uuid(),
      deliveryType: z.string(),
      variant: z.object({
        sku: z.string(),
        product: z.object({
          name: z.string(),
        }),
      }),
    }),
  })),
});

export type GetSellerOrdersResponse = z.infer<typeof GetSellerOrdersResponseSchema>;
