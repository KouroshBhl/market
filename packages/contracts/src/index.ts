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
