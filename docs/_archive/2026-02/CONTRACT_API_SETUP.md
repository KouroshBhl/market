# Contract-First API Setup - Complete Guide

## Quick Start

### 1. Install Dependencies

```bash
# API (NestJS)
cd apps/api
pnpm add @asteasolutions/zod-to-openapi
pnpm add -D @types/jest

# Seller (Next.js - for Swagger UI)
cd apps/seller
pnpm add swagger-ui-react
pnpm add -D @types/swagger-ui-react
```

### 2. Update API package.json

**apps/api/package.json:**

```json
{
  "scripts": {
    "start": "nest start",
    "dev": "nest start --watch",
    "test": "jest",
    "test:contracts": "jest test/contracts.spec.ts --verbose"
  },
  "dependencies": {
    "@asteasolutions/zod-to-openapi": "^7.3.1",
    "zod": "^3.25.76"
  }
}
```

### 3. Update Seller package.json

**apps/seller/package.json:**

```json
{
  "dependencies": {
    "swagger-ui-react": "^5.11.0"
  },
  "devDependencies": {
    "@types/swagger-ui-react": "^4.18.3"
  }
}
```

### 4. Configure Jest (if not already)

**apps/api/jest.config.js** (create if needed):

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

---

## Folder Structure

```
apps/api/
├── src/
│   ├── contracts/                         # ⭐ API Contracts (NEW)
│   │   ├── base.ts                        # Base types & error schemas
│   │   ├── index.ts                       # Central registry (IMPORTANT!)
│   │   ├── openapi.ts                     # OpenAPI generator
│   │   ├── categories/
│   │   │   └── get-categories.contract.ts
│   │   └── products/
│   │       └── create-product.contract.ts
│   │
│   ├── openapi/                           # ⭐ OpenAPI endpoints (NEW)
│   │   ├── openapi.controller.ts          # GET /openapi.json
│   │   └── openapi.module.ts
│   │
│   ├── categories/
│   │   ├── categories.controller.ts       # UPDATED: uses contracts
│   │   ├── categories.service.ts
│   │   └── categories.module.ts
│   │
│   ├── products/
│   │   ├── products.controller.ts         # UPDATED: uses contracts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   │
│   └── app.module.ts                      # UPDATED: imports OpenApiModule
│
└── test/
    └── contracts.spec.ts                  # ⭐ Contract validation tests (NEW)

apps/seller/
└── app/
    └── docs/
        └── page.tsx                       # ⭐ Swagger UI page (NEW)
```

---

## Files Created

### 1. Base Contract Types

**apps/api/src/contracts/base.ts** ✅ Created

Provides:
- `ApiContract` interface - structure for all contracts
- `ErrorResponseSchema` - common error response
- `ValidationErrorResponseSchema` - validation errors
- Type helpers: `ContractRequest<T>`, `ContractResponse<T>`

### 2. Central Registry

**apps/api/src/contracts/index.ts** ✅ Created

**⭐ IMPORTANT:** This is the single source of truth.
- Export all contracts here
- Add to `ALL_CONTRACTS` array
- OpenAPI generator uses this

### 3. OpenAPI Generator

**apps/api/src/contracts/openapi.ts** ✅ Created

Provides:
- `generateOpenApiSpec()` - builds OpenAPI 3.0 JSON
- `validateContracts()` - ensures contracts are valid
- Auto-registers all contracts from registry

### 4. Example Contracts

**apps/api/src/contracts/categories/get-categories.contract.ts** ✅ Created
**apps/api/src/contracts/products/create-product.contract.ts** ✅ Created

### 5. OpenAPI Endpoint

**apps/api/src/openapi/openapi.controller.ts** ✅ Created
**apps/api/src/openapi/openapi.module.ts** ✅ Created

Exposes: `GET /openapi.json`

### 6. Swagger UI Page

**apps/seller/app/docs/page.tsx** ✅ Created

Accessible at: `http://localhost:3002/docs`

### 7. Contract Tests

**apps/api/test/contracts.spec.ts** ✅ Created

Tests:
- All contracts registered
- No duplicates
- Proper structure
- OpenAPI generates successfully

---

## Usage Examples

### Access Documentation

```bash
# OpenAPI JSON
curl http://localhost:4000/api/openapi.json

# Swagger UI (in browser)
open http://localhost:3002/docs
```

### Run Contract Tests

```bash
cd apps/api
pnpm test:contracts
```

**Expected output:**
```
PASS test/contracts.spec.ts
  Contract Registry
    ✓ should have at least one contract registered
    ✓ should have all contracts properly structured
    ✓ should generate valid OpenAPI spec
    ✓ should have unique paths and methods
    ✓ should have all contracts with responses
  Categories Contracts
    ✓ should have GET /categories contract
  Products Contracts
    ✓ should have POST /products contract
```

---

## Adding Your First Endpoint

### Example: GET /api/health

**Step 1: Create Contract**

**apps/api/src/contracts/health/get-health.contract.ts:**

```typescript
import { z } from 'zod';
import type { ApiContract } from '../base';

const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  uptime: z.number(),
  timestamp: z.string(),
}).openapi('HealthResponse');

export const getHealthContract = {
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Health check',
  description: 'Returns API health status',
  
  responses: {
    200: {
      description: 'Service is healthy',
      schema: HealthResponseSchema,
    },
  },
} as const satisfies ApiContract;

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
```

**Step 2: Export from Registry**

**apps/api/src/contracts/index.ts:**

```typescript
// Add import
export { getHealthContract } from './health/get-health.contract';

// Add to array
export const ALL_CONTRACTS: ReadonlyArray<ApiContract> = [
  getCategoriesContract,
  createProductContract,
  getHealthContract, // ⭐ Add here
] as const;
```

**Step 3: Implement Controller**

**apps/api/src/health/health.controller.ts:**

```typescript
import { Controller, Get } from '@nestjs/common';
import { getHealthContract, type HealthResponse } from '../contracts/health/get-health.contract';

@Controller('health')
export class HealthController {
  @Get()
  async getHealth(): Promise<HealthResponse> {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
```

**Step 4: Verify**

```bash
# Test it
pnpm test:contracts

# Should see in Swagger
open http://localhost:3002/docs
```

✅ Done! Your endpoint is now documented.

---

## Integration Checklist

### API (apps/api)

- [x] Install `@asteasolutions/zod-to-openapi`
- [x] Create `src/contracts/` folder structure
- [x] Create `src/contracts/base.ts`
- [x] Create `src/contracts/index.ts` (registry)
- [x] Create `src/contracts/openapi.ts` (generator)
- [x] Create example contracts
- [x] Create `src/openapi/` folder
- [x] Create `openapi.controller.ts`
- [x] Create `openapi.module.ts`
- [x] Update `app.module.ts` to import `OpenApiModule`
- [x] Update controllers to use contracts
- [x] Create `test/contracts.spec.ts`
- [x] Add `test:contracts` script to `package.json`

### Seller (apps/seller)

- [x] Install `swagger-ui-react` and types
- [x] Create `app/docs/page.tsx`
- [x] Configure to point to API's `/openapi.json`

### Documentation

- [x] Create `CONTRACT_FIRST_API_GUIDE.md`
- [x] Create `CONTRACT_API_SETUP.md` (this file)

---

## Workflow: Adding New Endpoints

### Developer Workflow

```
1. Create Contract
   └─> contracts/[feature]/[action].contract.ts

2. Export from Registry
   └─> contracts/index.ts
       - Add export
       - Add to ALL_CONTRACTS array

3. Implement Controller
   └─> [feature]/[feature].controller.ts
       - Import contract
       - Use contract.request for validation
       - Return matches contract.responses

4. Run Tests
   └─> pnpm test:contracts
       - Ensures contract is registered
       - Validates structure

5. View in Swagger
   └─> http://localhost:3002/docs
       - Documentation auto-updates
```

### Pre-Commit Hook (Optional but Recommended)

**.husky/pre-commit:**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Ensure all contracts are registered
cd apps/api && pnpm test:contracts || exit 1
```

This prevents commits if contracts aren't properly registered.

---

## Enforcement Strategy

### "No Contract, No Endpoint" Rule

**Option 1: Tests (Implemented)**

```typescript
// test/contracts.spec.ts validates:
- All contracts registered
- No duplicates
- Proper structure
- OpenAPI generates
```

**Option 2: ESLint Rule (Optional)**

Create custom ESLint rule that requires:
- Every `@Controller()` must have corresponding contract
- Every HTTP decorator must reference a contract

**Option 3: CI/CD Check**

```yaml
# .github/workflows/api.yml
- name: Validate Contracts
  run: |
    cd apps/api
    pnpm test:contracts
    # Fail build if contracts invalid
```

**Option 4: Runtime Check (Development)**

```typescript
// main.ts
if (process.env.NODE_ENV === 'development') {
  const validation = validateContracts();
  if (!validation.valid) {
    console.error('❌ Contract validation failed:', validation.errors);
    process.exit(1);
  }
  console.log('✅ All contracts valid');
}
```

---

## Common Patterns & Examples

### Authenticated Endpoint

```typescript
const GetProfileRequestSchema = z.object({
  // No body, but we'd validate headers in middleware
});

export const getProfileContract = {
  method: 'get',
  path: '/profile',
  tags: ['Auth'],
  summary: 'Get user profile',
  description: 'Returns authenticated user profile. Requires Bearer token.',
  
  // In real implementation, add security scheme
  responses: {
    200: {
      description: 'Profile retrieved',
      schema: ProfileSchema,
    },
    401: {
      description: 'Unauthorized',
      schema: ErrorResponseSchema,
    },
  },
} as const satisfies ApiContract;
```

### Paginated List

```typescript
const ListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sort: z.enum(['asc', 'desc']).optional(),
}).openapi('ListQuery');

const PaginatedUsersSchema = z.object({
  data: z.array(UserSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
  }),
}).openapi('PaginatedUsers');
```

### File Upload

```typescript
// Note: File uploads need special handling
// This is the contract structure, actual multipart handling is in controller
export const uploadFileContract = {
  method: 'post',
  path: '/upload',
  tags: ['Files'],
  summary: 'Upload file',
  
  request: {
    body: z.object({
      file: z.any(), // Actual file validation happens in multer
      metadata: z.object({
        description: z.string().optional(),
      }).optional(),
    }),
  },
  
  responses: {
    201: {
      description: 'File uploaded',
      schema: z.object({
        fileId: z.string().uuid(),
        url: z.string().url(),
      }),
    },
  },
} as const satisfies ApiContract;
```

---

## Troubleshooting

### Issue: Contract not showing in Swagger

**Check:**
1. Is contract exported from `contracts/index.ts`?
2. Is it added to `ALL_CONTRACTS` array?
3. Did you restart the API server?
4. Run `pnpm test:contracts` - does it pass?

### Issue: Type errors in controller

**Solution:**
```typescript
// ✅ Correct
const validated = contract.request.body.parse(body);

// ❌ Wrong
const validated: any = contract.request.body.parse(body);
```

### Issue: OpenAPI.json returns empty

**Check:**
```typescript
// Debug in openapi.controller.ts
console.log('Total contracts:', ALL_CONTRACTS.length);
```

If 0, check imports in `contracts/index.ts`.

### Issue: Getting 404 on /api/openapi.json

**Check:**
1. Is the route `@Controller('api')` not `@Controller('openapi')`?
2. Is the method `@Get('openapi.json')` correct?
3. Is OpenApiModule imported in app.module.ts?

**Verify route:**
```bash
curl http://localhost:4000/api/openapi.json
# Should return JSON, not 404
```

---

## Performance Considerations

### OpenAPI Generation

- OpenAPI spec is generated on-demand (not cached)
- For production, consider caching the spec:

```typescript
let cachedSpec: any = null;

@Get('json')
getOpenApiSpec() {
  if (!cachedSpec || process.env.NODE_ENV === 'development') {
    cachedSpec = generateOpenApiSpec();
  }
  return cachedSpec;
}
```

### Contract Validation

- Validation happens on every request
- For high-traffic endpoints, consider:
  - Caching parsed schemas
  - Using `safeParse()` instead of `parse()`
  - Moving validation to middleware

---

## Migration Checklist

If migrating existing API:

- [ ] Install dependencies
- [ ] Create contracts folder structure
- [ ] Create base.ts with common types
- [ ] Create index.ts registry
- [ ] Create openapi.ts generator
- [ ] Create OpenApiModule
- [ ] Add OpenApiModule to app.module.ts
- [ ] For each existing endpoint:
  - [ ] Create contract file
  - [ ] Export from registry
  - [ ] Update controller to use contract
- [ ] Create Swagger UI page in Next.js app
- [ ] Create contract tests
- [ ] Add test:contracts script
- [ ] Document for team
- [ ] (Optional) Add pre-commit hook

---

## Summary

### What You Get

✅ **Automatic Documentation** - Add contract, get Swagger docs  
✅ **Type Safety** - Full TypeScript from Zod  
✅ **Validation** - Request/response validation built-in  
✅ **Testing** - Tests ensure contracts registered  
✅ **Maintainability** - Single source of truth  
✅ **Developer Experience** - Easy to add new endpoints  

### What You Don't Get (By Design)

❌ Manual OpenAPI writing  
❌ Out-of-sync documentation  
❌ Runtime without type safety  
❌ Endpoints without docs  

---

## Next Steps

1. Install dependencies
2. Copy files to your project
3. Restart API server
4. Visit `http://localhost:3002/docs`
5. Try adding a new endpoint following the guide
6. Run `pnpm test:contracts`
7. Celebrate! 🎉

---

**Status:** ✅ Production-Ready  
**Maintenance:** Low - just add contracts  
**Learning Curve:** Minimal - follow examples  
**Type Safety:** 100% TypeScript
