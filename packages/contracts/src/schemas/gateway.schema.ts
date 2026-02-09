import { z } from 'zod';

// ============================================
// PLATFORM GATEWAYS — Seller Payment Methods
// ============================================

export const SettlementModeSchema = z.enum([
  'PLATFORM_COLLECT',
  'SELLER_DIRECT',
]).openapi('SettlementMode');

export type SettlementMode = z.infer<typeof SettlementModeSchema>;

export const GatewayStatusSchema = z.enum([
  'AVAILABLE',
  'ADMIN_LOCKED',
  'GLOBALLY_DISABLED',
]).openapi('GatewayStatus');

export type GatewayStatus = z.infer<typeof GatewayStatusSchema>;

// Gateway info as returned to seller
export const PlatformGatewaySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  provider: z.string(),
  isEnabledGlobally: z.boolean(),
  sellerCanToggle: z.boolean(),
  defaultEnabledForNewSellers: z.boolean(),
  sortOrder: z.number().int(),
}).openapi('PlatformGateway');

export type PlatformGateway = z.infer<typeof PlatformGatewaySchema>;

// A single gateway entry in the seller gateways list
export const SellerGatewayItemSchema = z.object({
  gateway: PlatformGatewaySchema,
  sellerPreference: z.object({
    isEnabled: z.boolean(),
  }).nullable(),
  effectiveEnabled: z.boolean(),
  status: GatewayStatusSchema,
}).openapi('SellerGatewayItem');

export type SellerGatewayItem = z.infer<typeof SellerGatewayItemSchema>;

// GET /seller/:sellerId/gateways response
export const GetSellerGatewaysResponseSchema = z.object({
  gateways: z.array(SellerGatewayItemSchema),
}).openapi('GetSellerGatewaysResponse');

export type GetSellerGatewaysResponse = z.infer<typeof GetSellerGatewaysResponseSchema>;

// PATCH /seller/:sellerId/gateways/:gatewayId request body
export const UpdateSellerGatewaySchema = z.object({
  isEnabled: z.boolean(),
}).openapi('UpdateSellerGateway');

export type UpdateSellerGateway = z.infer<typeof UpdateSellerGatewaySchema>;

// PATCH /seller/:sellerId/gateways/:gatewayId response
export const UpdateSellerGatewayResponseSchema = z.object({
  gateway: PlatformGatewaySchema,
  sellerPreference: z.object({
    isEnabled: z.boolean(),
  }),
  effectiveEnabled: z.boolean(),
  status: GatewayStatusSchema,
}).openapi('UpdateSellerGatewayResponse');

export type UpdateSellerGatewayResponse = z.infer<typeof UpdateSellerGatewayResponseSchema>;
