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
import { 
  ProductSchema, 
  ProductStatusSchema,
  AutoKeyConfigSchema,
  ManualDeliveryConfigSchema 
} from './schemas/product.schema';
import { DeliveryTypeSchema } from './schemas/delivery-type.schema';
import { 
  ProductDraftSchema, 
  SaveProductDraftSchema,
  UpdateProductDraftSchema,
  UpdateProductStatusSchema 
} from './schemas/product-draft.schema';
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
  UpdateOfferStatusSchema,
  GetSellerOffersResponseSchema,
} from './schemas/offer.schema';

// Register schemas
registry.register('HealthResponse', HealthResponseSchema);
registry.register('VersionResponse', VersionResponseSchema);
registry.register('User', UserSchema);
registry.register('Currency', CurrencySchema);
registry.register('Product', ProductSchema);
registry.register('ProductStatus', ProductStatusSchema);
registry.register('DeliveryType', DeliveryTypeSchema);
registry.register('ProductDraft', ProductDraftSchema);
registry.register('SaveProductDraft', SaveProductDraftSchema);
registry.register('UpdateProductDraft', UpdateProductDraftSchema);
registry.register('UpdateProductStatus', UpdateProductStatusSchema);
registry.register('AutoKeyConfig', AutoKeyConfigSchema);
registry.register('ManualDeliveryConfig', ManualDeliveryConfigSchema);
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
registry.register('UpdateOfferStatus', UpdateOfferStatusSchema);
registry.register('GetSellerOffersResponse', GetSellerOffersResponseSchema);
