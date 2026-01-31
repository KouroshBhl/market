import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

// Export all schemas and types
export * from './schemas';

// Create and export OpenAPI registry
export const registry = new OpenAPIRegistry();

// Import schemas for registration
import { HealthResponseSchema } from './schemas/health.schema';
import { VersionResponseSchema } from './schemas/version.schema';
import { UserSchema } from './schemas/user.schema';

// Register schemas
registry.register('HealthResponse', HealthResponseSchema);
registry.register('VersionResponse', VersionResponseSchema);
registry.register('User', UserSchema);
