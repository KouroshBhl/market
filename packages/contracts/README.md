# @workspace/contracts

API contracts using Zod schemas with OpenAPI support.

## Purpose
- Single source of truth for API contracts
- Shared between backend and frontend apps
- Type-safe validation with TypeScript inference
- OpenAPI/Swagger documentation generation

## Usage

```typescript
import { HealthResponseSchema, VersionResponseSchema, UserSchema } from '@workspace/contracts';
import type { HealthResponse, VersionResponse, User } from '@workspace/contracts';

// Validate data
const health = HealthResponseSchema.parse({ ok: true });

// Use types
const user: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  createdAt: new Date().toISOString()
};
```

## Schemas

- `HealthResponseSchema` - Health check response
- `VersionResponseSchema` - Version info response
- `UserSchema` - User entity

## OpenAPI

The package exports a pre-configured OpenAPI registry with all schemas registered for documentation generation.
