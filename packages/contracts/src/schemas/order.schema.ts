import { z } from 'zod';
import { CurrencySchema } from './currency.schema';

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
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;

// POST /orders - Create order
export const CreateOrderSchema = z.object({
  buyerId: z.string().uuid(),
  offerId: z.string().uuid(),
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
