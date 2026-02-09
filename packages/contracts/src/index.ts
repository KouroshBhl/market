import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

// Export all schemas and types
export * from './schemas';

// Create and export OpenAPI registry
export const registry = new OpenAPIRegistry();

// Import schemas for registration
import { HealthResponseSchema } from './schemas/health.schema';
import { VersionResponseSchema } from './schemas/version.schema';
import { UserSchema } from './schemas/user.schema';
import { CurrencySchema } from './schemas/currency.schema';
import { DeliveryTypeSchema } from './schemas/delivery-type.schema';
import {
  CatalogProductSchema,
  CatalogVariantSchema,
  CatalogVariantWithProductSchema,
  RegionSchema,
  GetCatalogProductsResponseSchema,
  GetCatalogVariantsResponseSchema,
} from './schemas/catalog.schema';
import {
  OfferSchema,
  OfferStatusSchema,
  OfferWithDetailsSchema,
  SaveOfferDraftSchema,
  PublishOfferSchema,
  UpdateOfferSchema,
  UpdateOfferStatusSchema,
  GetSellerOffersResponseSchema,
} from './schemas/offer.schema';
import {
  KeyStatusSchema,
  KeyPoolSchema,
  KeyPoolWithCountsSchema,
  CreateKeyPoolSchema,
  UploadKeysSchema,
  UploadKeysResponseSchema,
  KeyMetadataSchema,
  GetKeyPoolResponseSchema,
  InvalidateKeyResponseSchema,
  AvailabilityStatusSchema,
  KeyListItemSchema,
  ListKeysResponseSchema,
  KeyPoolStatsSchema,
  EditKeySchema,
  EditKeyResponseSchema,
  RevealKeyResponseSchema,
  KeyAuditActionSchema,
} from './schemas/key-pool.schema';
import {
  OrderStatusSchema,
  WorkStateSchema,
  OrderSchema,
  CreateOrderSchema,
  PayOrderResponseSchema,
  FulfillAutoKeyResponseSchema,
  FulfillManualResponseSchema,
  GetOrderResponseSchema,
  SellerOrderSchema,
  GetSellerOrderResponseSchema,
  GetSellerOrdersResponseSchema,
  OrderSortSchema,
  OrderFilterTabSchema,
  GetSellerOrdersQuerySchema,
  GetSellerOrdersCursorResponseSchema,
  ClaimOrderResponseSchema,
  ReassignOrderSchema,
  ReassignOrderResponseSchema,
} from './schemas/order.schema';

import {
  SellerTeamRoleSchema,
  SellerPermissionSchema,
  MemberStatusSchema,
  SellerTeamMemberSchema,
  SellerInviteSchema,
  SellerMembershipSchema,
  GetSellerTeamResponseSchema,
  InviteMemberRequestSchema,
  InviteMemberResponseSchema,
  ChangeRoleRequestSchema,
  ChangeRoleResponseSchema,
  RemoveMemberResponseSchema,
  GetMembershipsResponseSchema,
  RevokeInviteResponseSchema,
  AcceptInviteRequestSchema,
  AcceptInviteResponseSchema,
} from './schemas/seller-team.schema';

import {
  RequirementFieldTypeSchema,
  FieldValidationSchema,
  RequirementFieldSchema,
  RequirementTemplateSchema,
  RequirementTemplateWithFieldsSchema,
  GetVariantRequirementsResponseSchema,
  CreateRequirementTemplateSchema,
  UpdateRequirementTemplateSchema,
  RequirementTemplateAdminResponseSchema,
  GetRequirementTemplatesResponseSchema,
  RequirementsPayloadSchema,
} from './schemas/requirement.schema';

import {
  SettlementModeSchema,
  GatewayStatusSchema,
  PlatformGatewaySchema,
  SellerGatewayItemSchema,
  GetSellerGatewaysResponseSchema,
  UpdateSellerGatewaySchema,
  UpdateSellerGatewayResponseSchema,
} from './schemas/gateway.schema';

import {
  UserRoleSchema,
  SignupRequestSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
  ExchangeCodeRequestSchema,
  SetPasswordRequestSchema,
  ChangePasswordRequestSchema,
  PasswordOkResponseSchema,
  ResendVerificationRequestSchema,
  ResendVerificationResponseSchema,
  AuthTokensResponseSchema,
  AuthUserSchema,
  AuthMeResponseSchema,
  LogoutResponseSchema,
  SellerSetupRequestSchema,
  SellerProfileSchema,
  AuthErrorSchema,
} from './schemas/auth.schema';

// Register schemas
registry.register('HealthResponse', HealthResponseSchema);
registry.register('VersionResponse', VersionResponseSchema);
registry.register('User', UserSchema);
registry.register('Currency', CurrencySchema);
registry.register('DeliveryType', DeliveryTypeSchema);
registry.register('Region', RegionSchema);
registry.register('CatalogProduct', CatalogProductSchema);
registry.register('CatalogVariant', CatalogVariantSchema);
registry.register('CatalogVariantWithProduct', CatalogVariantWithProductSchema);
registry.register('GetCatalogProductsResponse', GetCatalogProductsResponseSchema);
registry.register('GetCatalogVariantsResponse', GetCatalogVariantsResponseSchema);
registry.register('Offer', OfferSchema);
registry.register('OfferStatus', OfferStatusSchema);
registry.register('OfferWithDetails', OfferWithDetailsSchema);
registry.register('SaveOfferDraft', SaveOfferDraftSchema);
registry.register('PublishOffer', PublishOfferSchema);
registry.register('UpdateOffer', UpdateOfferSchema);
registry.register('UpdateOfferStatus', UpdateOfferStatusSchema);
registry.register('GetSellerOffersResponse', GetSellerOffersResponseSchema);

// Key Pool schemas
registry.register('KeyStatus', KeyStatusSchema);
registry.register('KeyPool', KeyPoolSchema);
registry.register('KeyPoolWithCounts', KeyPoolWithCountsSchema);
registry.register('CreateKeyPool', CreateKeyPoolSchema);
registry.register('UploadKeys', UploadKeysSchema);
registry.register('UploadKeysResponse', UploadKeysResponseSchema);
registry.register('KeyMetadata', KeyMetadataSchema);
registry.register('GetKeyPoolResponse', GetKeyPoolResponseSchema);
registry.register('InvalidateKeyResponse', InvalidateKeyResponseSchema);
registry.register('AvailabilityStatus', AvailabilityStatusSchema);
registry.register('KeyListItem', KeyListItemSchema);
registry.register('ListKeysResponse', ListKeysResponseSchema);
registry.register('KeyPoolStats', KeyPoolStatsSchema);
registry.register('EditKey', EditKeySchema);
registry.register('EditKeyResponse', EditKeyResponseSchema);
registry.register('RevealKeyResponse', RevealKeyResponseSchema);
registry.register('KeyAuditAction', KeyAuditActionSchema);

// Order schemas
registry.register('OrderStatus', OrderStatusSchema);
registry.register('WorkState', WorkStateSchema);
registry.register('Order', OrderSchema);
registry.register('CreateOrder', CreateOrderSchema);
registry.register('PayOrderResponse', PayOrderResponseSchema);
registry.register('FulfillAutoKeyResponse', FulfillAutoKeyResponseSchema);
registry.register('FulfillManualResponse', FulfillManualResponseSchema);
registry.register('GetOrderResponse', GetOrderResponseSchema);
registry.register('SellerOrder', SellerOrderSchema);
registry.register('GetSellerOrderResponse', GetSellerOrderResponseSchema);
registry.register('GetSellerOrdersResponse', GetSellerOrdersResponseSchema);
registry.register('OrderSort', OrderSortSchema);
registry.register('OrderFilterTab', OrderFilterTabSchema);
registry.register('GetSellerOrdersQuery', GetSellerOrdersQuerySchema);
registry.register('GetSellerOrdersCursorResponse', GetSellerOrdersCursorResponseSchema);
registry.register('ClaimOrderResponse', ClaimOrderResponseSchema);
registry.register('ReassignOrder', ReassignOrderSchema);
registry.register('ReassignOrderResponse', ReassignOrderResponseSchema);

// Seller Team schemas
registry.register('SellerTeamRole', SellerTeamRoleSchema);
registry.register('SellerPermission', SellerPermissionSchema);
registry.register('MemberStatus', MemberStatusSchema);
registry.register('SellerTeamMember', SellerTeamMemberSchema);
registry.register('SellerInvite', SellerInviteSchema);
registry.register('SellerMembership', SellerMembershipSchema);
registry.register('GetSellerTeamResponse', GetSellerTeamResponseSchema);
registry.register('InviteMemberRequest', InviteMemberRequestSchema);
registry.register('InviteMemberResponse', InviteMemberResponseSchema);
registry.register('ChangeRoleRequest', ChangeRoleRequestSchema);
registry.register('ChangeRoleResponse', ChangeRoleResponseSchema);
registry.register('RemoveMemberResponse', RemoveMemberResponseSchema);
registry.register('GetMembershipsResponse', GetMembershipsResponseSchema);
registry.register('RevokeInviteResponse', RevokeInviteResponseSchema);
registry.register('AcceptInviteRequest', AcceptInviteRequestSchema);
registry.register('AcceptInviteResponse', AcceptInviteResponseSchema);

// Requirement schemas
registry.register('RequirementFieldType', RequirementFieldTypeSchema);
registry.register('FieldValidation', FieldValidationSchema);
registry.register('RequirementField', RequirementFieldSchema);
registry.register('RequirementTemplate', RequirementTemplateSchema);
registry.register('RequirementTemplateWithFields', RequirementTemplateWithFieldsSchema);
registry.register('GetVariantRequirementsResponse', GetVariantRequirementsResponseSchema);
registry.register('CreateRequirementTemplate', CreateRequirementTemplateSchema);
registry.register('UpdateRequirementTemplate', UpdateRequirementTemplateSchema);
registry.register('RequirementTemplateAdminResponse', RequirementTemplateAdminResponseSchema);
registry.register('GetRequirementTemplatesResponse', GetRequirementTemplatesResponseSchema);
registry.register('RequirementsPayload', RequirementsPayloadSchema);

// Gateway schemas
registry.register('SettlementMode', SettlementModeSchema);
registry.register('GatewayStatus', GatewayStatusSchema);
registry.register('PlatformGateway', PlatformGatewaySchema);
registry.register('SellerGatewayItem', SellerGatewayItemSchema);
registry.register('GetSellerGatewaysResponse', GetSellerGatewaysResponseSchema);
registry.register('UpdateSellerGateway', UpdateSellerGatewaySchema);
registry.register('UpdateSellerGatewayResponse', UpdateSellerGatewayResponseSchema);

// Auth schemas
registry.register('UserRole', UserRoleSchema);
registry.register('SignupRequest', SignupRequestSchema);
registry.register('LoginRequest', LoginRequestSchema);
registry.register('RefreshRequest', RefreshRequestSchema);
registry.register('ExchangeCodeRequest', ExchangeCodeRequestSchema);
registry.register('AuthTokensResponse', AuthTokensResponseSchema);
registry.register('AuthUser', AuthUserSchema);
registry.register('AuthMeResponse', AuthMeResponseSchema);
registry.register('LogoutResponse', LogoutResponseSchema);
registry.register('SellerSetupRequest', SellerSetupRequestSchema);
registry.register('SellerProfile', SellerProfileSchema);
registry.register('AuthError', AuthErrorSchema);
registry.register('SetPasswordRequest', SetPasswordRequestSchema);
registry.register('ChangePasswordRequest', ChangePasswordRequestSchema);
registry.register('PasswordOkResponse', PasswordOkResponseSchema);
registry.register('ResendVerificationRequest', ResendVerificationRequestSchema);
registry.register('ResendVerificationResponse', ResendVerificationResponseSchema);
