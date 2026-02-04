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
  OrderSchema,
  CreateOrderSchema,
  PayOrderResponseSchema,
  FulfillOrderResponseSchema,
  GetOrderResponseSchema,
  SellerOrderSchema,
  GetSellerOrderResponseSchema,
  GetSellerOrdersResponseSchema,
} from './schemas/order.schema';

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
registry.register('Order', OrderSchema);
registry.register('CreateOrder', CreateOrderSchema);
registry.register('PayOrderResponse', PayOrderResponseSchema);
registry.register('FulfillOrderResponse', FulfillOrderResponseSchema);
registry.register('GetOrderResponse', GetOrderResponseSchema);
registry.register('SellerOrder', SellerOrderSchema);
registry.register('GetSellerOrderResponse', GetSellerOrderResponseSchema);
registry.register('GetSellerOrdersResponse', GetSellerOrdersResponseSchema);

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
