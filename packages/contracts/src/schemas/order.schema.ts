import { z } from 'zod';
import { CurrencySchema } from './currency.schema';
import { RequirementsPayloadSchema } from './requirement.schema';

// ============================================
// ORDER - Full Order System with Assignment Workflow
// ============================================

export const OrderStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'PAID',
  'FULFILLED',
  'CANCELLED',
  'EXPIRED',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const WorkStateSchema = z.enum(['UNASSIGNED', 'IN_PROGRESS', 'DONE']);
export type WorkState = z.infer<typeof WorkStateSchema>;

// Base Order
export const OrderSchema = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  offerId: z.string().uuid(),
  status: OrderStatusSchema,
  
  // Price snapshots
  basePriceAmount: z.number().int(),
  platformFeeBpsSnapshot: z.number().int(),
  feeAmount: z.number().int(),
  buyerTotalAmount: z.number().int(),
  currency: CurrencySchema,
  
  // Timestamps
  paidAt: z.string().nullable(),
  fulfilledAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  
  // deliveredKey is NOT included - only returned in fulfill response
  // requirementsPayload is NOT included in base schema - only in seller view
  // Assignment fields are NOT included in base schema - only in admin/seller views
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

// POST /orders/:id/fulfill-auto - Fulfill AUTO_KEY order atomically
export const FulfillAutoKeyResponseSchema = z.object({
  success: z.boolean(),
  order: OrderSchema,
  deliveredKey: z.string(),
});

export type FulfillAutoKeyResponse = z.infer<typeof FulfillAutoKeyResponseSchema>;

// POST /orders/:id/fulfill-manual - Fulfill MANUAL order
export const FulfillManualResponseSchema = z.object({
  success: z.boolean(),
  order: OrderSchema,
});

export type FulfillManualResponse = z.infer<typeof FulfillManualResponseSchema>;

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

// Seller view of order with buyer requirements and computed fields
export const SellerOrderSchema = OrderSchema.extend({
  // Buyer-provided requirements (sensitive fields masked/decrypted as needed)
  requirementsPayload: RequirementsPayloadSchema.nullable(),
  
  // Computed fields for seller dashboard
  isOverdue: z.boolean(),
  slaDueAt: z.string().nullable(), // ISO string, computed from paidAt + SLA
  
  // Seller team assignment (if assigned)
  assignedToUserId: z.string().uuid().nullable(),
  workState: WorkStateSchema.nullable(),
  assignedTo: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
  }).nullable(),
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

// GET /orders/seller - List seller orders (renamed from /seller/orders for consistency)
export const GetSellerOrdersResponseSchema = z.object({
  orders: z.array(SellerOrderSchema.extend({
    offer: z.object({
      id: z.string().uuid(),
      deliveryType: z.string(),
      estimatedDeliveryMinutes: z.number().int().nullable(),
      variant: z.object({
        sku: z.string(),
        region: z.string(),
        product: z.object({
          name: z.string(),
        }),
      }),
    }),
  })),
});

export type GetSellerOrdersResponse = z.infer<typeof GetSellerOrdersResponseSchema>;

// Sorting options for seller orders list
export const OrderSortSchema = z.enum([
  'paidAt_desc',
  'paidAt_asc',
  'buyerTotalAmount_desc',
  'buyerTotalAmount_asc',
  'status_asc',
  'status_desc',
]);

export type OrderSort = z.infer<typeof OrderSortSchema>;

// Filter tabs for seller orders list
export const OrderFilterTabSchema = z.enum([
  'all',
  'unassigned',
  'needsFulfillment',
  'fulfilled',
  'overdue',
]);

export type OrderFilterTab = z.infer<typeof OrderFilterTabSchema>;

// GET /seller/orders (cursor-based pagination)
export const GetSellerOrdersQuerySchema = z.object({
  sellerId: z.string().uuid(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sort: OrderSortSchema.optional().default('paidAt_desc'),
  filterTab: OrderFilterTabSchema.optional().default('all'),
});

export type GetSellerOrdersQuery = z.infer<typeof GetSellerOrdersQuerySchema>;

export const GetSellerOrdersCursorResponseSchema = z.object({
  items: z.array(SellerOrderSchema),
  nextCursor: z.string().nullable(),
});

export type GetSellerOrdersCursorResponse = z.infer<typeof GetSellerOrdersCursorResponseSchema>;

// ============================================
// SELLER TEAM ASSIGNMENT WORKFLOW
// ============================================

// POST /seller/orders/:id/claim - Seller team member claims order
export const ClaimOrderResponseSchema = z.object({
  success: z.boolean(),
  order: OrderSchema.extend({
    assignedToUserId: z.string().uuid().nullable(),
    assignedAt: z.string().nullable(),
    workState: WorkStateSchema.nullable(),
    assignedTo: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string().nullable(),
    }).nullable(),
  }),
});

export type ClaimOrderResponse = z.infer<typeof ClaimOrderResponseSchema>;

// PATCH /seller/orders/:id/assignee - Owner reassigns order
export const ReassignOrderSchema = z.object({
  assignedToUserId: z.string().uuid(),
});

export type ReassignOrder = z.infer<typeof ReassignOrderSchema>;

export const ReassignOrderResponseSchema = z.object({
  success: z.boolean(),
  order: OrderSchema.extend({
    assignedToUserId: z.string().uuid().nullable(),
    assignedAt: z.string().nullable(),
    workState: WorkStateSchema.nullable(),
  }),
});

export type ReassignOrderResponse = z.infer<typeof ReassignOrderResponseSchema>;
