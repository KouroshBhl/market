# Contract-First API with Auto-Generated Swagger

## Overview

This implementation provides a **contract-first API pattern** with automatic OpenAPI/Swagger documentation. When you add a new endpoint, the documentation updates automatically as long as you define a contract.

### Key Features

✅ **Contract-First Design** - Define schemas before implementation  
✅ **Auto-Generated OpenAPI** - No manual spec writing  
✅ **Type Safety** - Full TypeScript types from Zod schemas  
✅ **Interactive Docs** - Swagger UI at `/docs`  
✅ **Validation** - Request/response validation built-in  
✅ **Testable** - Tests ensure all contracts are registered  

---

## Architecture

```
apps/api/src/
├── contracts/
│   ├── base.ts                              # Base contract types
│   ├── index.ts                             # ⭐ Central registry (exports all)
│   ├── openapi.ts                           # OpenAPI generator
│   ├── categories/
│   │   └── get-categories.contract.ts       # GET /categories contract
│   └── products/
│       └── create-product.contract.ts       # POST /products contract
├── openapi/
│   ├── openapi.controller.ts                # GET /openapi.json endpoint
│   └── openapi.module.ts
└── [feature]/
    └── [feature].controller.ts              # Uses contracts for validation

apps/seller/app/
└── docs/
    └── page.tsx                             # Swagger UI page

test/
└── contracts.spec.ts                        # Validates all contracts registered
```

---

## Installation

### 1. Install Dependencies

```bash
# API app
cd apps/api
pnpm add @asteasolutions/zod-to-openapi

# Seller app (for Swagger UI)
cd apps/seller
pnpm add swagger-ui-react
pnpm add -D @types/swagger-ui-react
```

### 2. Update package.json scripts

**apps/api/package.json:**
```json
{
  "scripts": {
    "test:contracts": "jest test/contracts.spec.ts"
  }
}
```

---

## Usage

### Access Documentation

1. **OpenAPI JSON Spec**: `http://localhost:4000/api/openapi.json`
2. **Interactive Swagger UI**: `http://localhost:3002/docs`

---

## Adding a New Endpoint

Follow these 4 steps:

### Step 1: Create a Contract File

**Example:** `apps/api/src/contracts/users/get-users.contract.ts`

```typescript
import { z } from 'zod';
import type { ApiContract } from '../base';

// Define schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
}).openapi('User');

const GetUsersResponseSchema = z.object({
  users: z.array(UserSchema),
  total: z.number().int(),
}).openapi('GetUsersResponse');

// Define contract
export const getUsersContract = {
  method: 'get',
  path: '/users',
  tags: ['Users'],
  summary: 'Get all users',
  description: 'Returns a paginated list of users',
  
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  
  responses: {
    200: {
      description: 'Successfully retrieved users',
      schema: GetUsersResponseSchema,
    },
  },
} as const satisfies ApiContract;

export type GetUsersResponse = z.infer<typeof GetUsersResponseSchema>;
```

### Step 2: Export from Registry

**apps/api/src/contracts/index.ts**

```typescript
// ... existing imports

// Users
export { getUsersContract } from './users/get-users.contract';

// Update ALL_CONTRACTS array
export const ALL_CONTRACTS: ReadonlyArray<ApiContract> = [
  getCategoriesContract,
  createProductContract,
  getUsersContract, // ⭐ Add here
] as const;
```

### Step 3: Implement Controller

**apps/api/src/users/users.controller.ts**

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { getUsersContract, type GetUsersResponse } from '../contracts/users/get-users.contract';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(@Query() query: any): Promise<GetUsersResponse> {
    // Validate query params using contract
    const validated = getUsersContract.request.query.parse(query);
    
    // Business logic
    const users = await this.usersService.findAll(validated);
    
    // Return matches contract response
    return {
      users,
      total: users.length,
    };
  }
}
```

### Step 4: Verify

```bash
# Run contract tests (ensures it's registered)
pnpm test:contracts

# Check OpenAPI spec
curl http://localhost:4000/api/openapi.json | jq '.paths'

# View in Swagger UI
open http://localhost:3002/docs
```

✅ **That's it!** Your endpoint is now documented automatically.

---

## Contract Structure

Every contract must follow this structure:

```typescript
export const myContract = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: '/api/path',
  tags: ['Group Name'],
  summary: 'Short description',
  description: 'Longer description',
  
  request: {
    params: z.object({ id: z.string() }).optional(),
    query: z.object({ filter: z.string() }).optional(),
    body: z.object({ data: z.string() }).optional(),
  },
  
  responses: {
    200: {
      description: 'Success',
      schema: MyResponseSchema,
    },
    400: {
      description: 'Validation error',
      schema: ErrorResponseSchema,
    },
  },
} as const satisfies ApiContract;
```

---

## Best Practices

### 1. One Contract Per Endpoint

```
✅ Good:
contracts/users/get-users.contract.ts
contracts/users/create-user.contract.ts
contracts/users/update-user.contract.ts

❌ Bad:
contracts/users.contract.ts (multiple endpoints in one file)
```

### 2. Always Use `.openapi()` for Schemas

```typescript
✅ Good:
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
}).openapi('User');

❌ Bad:
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
}); // Missing .openapi()
```

### 3. Export Types for Controllers

```typescript
export const myContract = { ... };

// Export types for use in controllers
export type MyRequest = z.infer<typeof myContract.request.body>;
export type MyResponse = z.infer<typeof myContract.responses[200].schema>;
```

### 4. Use Consistent Naming

```typescript
// Contract file: get-users.contract.ts
export const getUsersContract = { ... };
export type GetUsersResponse = ...;

// Contract file: create-user.contract.ts
export const createUserContract = { ... };
export type CreateUserRequest = ...;
export type CreateUserResponse = ...;
```

---

## Validation Strategy

### Request Validation

```typescript
@Post()
async create(@Body() body: unknown) {
  // Validate using contract schema
  const validated = createUserContract.request.body.parse(body);
  
  // validated is now typed correctly
  const user = await this.usersService.create(validated);
  
  return user;
}
```

### Error Handling

```typescript
try {
  const validated = contract.request.body.parse(body);
  // ...
} catch (error) {
  if (error instanceof ZodError) {
    throw new HttpException(
      {
        statusCode: 400,
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
  throw error;
}
```

---

## Testing

### Contract Registry Test

**test/contracts.spec.ts** ensures:
- All contracts are registered
- No duplicate paths/methods
- All contracts have proper structure
- OpenAPI spec generates successfully

```bash
# Run tests
pnpm test:contracts

# If test fails, you forgot to:
# 1. Export contract from contracts/index.ts
# 2. Add to ALL_CONTRACTS array
```

### Testing Individual Contracts

```typescript
import { getUsersContract } from '../src/contracts/users/get-users.contract';

describe('GET /users', () => {
  it('should validate valid request', () => {
    const result = getUsersContract.request.query.safeParse({
      page: '1',
      limit: '10',
    });
    
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid request', () => {
    const result = getUsersContract.request.query.safeParse({
      page: 'invalid',
    });
    
    expect(result.success).toBe(false);
  });
});
```

---

## Common Patterns

### Paginated Response

```typescript
const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
  });

const GetUsersResponseSchema = PaginatedResponseSchema(UserSchema)
  .openapi('GetUsersResponse');
```

### Path Parameters

```typescript
export const getUserContract = {
  method: 'get',
  path: '/users/{id}',
  
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ example: 'abc-123' }),
    }),
  },
  
  responses: { ... },
} as const satisfies ApiContract;
```

### Request Body with Nested Objects

```typescript
const CreateProductRequestSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.object({
    amount: z.number().int().positive(),
    currency: z.enum(['USD', 'EUR']),
  }),
  tags: z.array(z.string()).optional(),
}).openapi('CreateProductRequest');
```

---

## Troubleshooting

### "Contract not showing in Swagger"

**Problem:** Added contract but not visible in `/docs`

**Solution:**
1. Check `contracts/index.ts` - Is your contract exported?
2. Check `ALL_CONTRACTS` array - Is it added there?
3. Run `pnpm test:contracts` - Does it pass?
4. Restart API server
5. Clear browser cache

### "Type error in controller"

**Problem:** TypeScript error when using contract types

**Solution:**
```typescript
// ❌ Don't do this
const data: any = contract.request.body.parse(body);

// ✅ Do this
const data = contract.request.body.parse(body);
// or
type RequestType = z.infer<typeof contract.request.body>;
const data: RequestType = contract.request.body.parse(body);
```

### "OpenAPI spec is empty"

**Problem:** `/api/openapi.json` returns empty paths

**Solution:**
1. Check `ALL_CONTRACTS` array is not empty
2. Run validation: `validateContracts()`
3. Check imports in `contracts/index.ts`

---

## Migration from Old Code

If you have existing endpoints without contracts:

### Before (Manual Swagger)
```typescript
@Post()
@ApiBody({ schema: { ... } }) // Manual
@ApiResponse({ status: 201, schema: { ... } }) // Manual
async create(@Body() dto: CreateDto) {
  // ...
}
```

### After (Contract-First)
```typescript
// 1. Create contract
// contracts/products/create-product.contract.ts
export const createProductContract = { ... };

// 2. Update controller
@Post()
async create(@Body() body: unknown) {
  const validated = createProductContract.request.body.parse(body);
  // ...
}

// 3. Export from registry
// contracts/index.ts
export const ALL_CONTRACTS = [..., createProductContract];
```

---

## Summary

### To Add a New Endpoint:

1. ✅ Create contract file: `contracts/[feature]/[action].contract.ts`
2. ✅ Export from registry: `contracts/index.ts`
3. ✅ Add to `ALL_CONTRACTS` array
4. ✅ Implement controller using contract
5. ✅ Run tests: `pnpm test:contracts`
6. ✅ View in Swagger: `http://localhost:3002/docs`

### No Manual Work Required For:

- ✅ OpenAPI JSON generation
- ✅ Swagger UI updates
- ✅ Type definitions
- ✅ Request validation
- ✅ Documentation sync

---

## Files Modified/Created

### Created:
```
apps/api/src/contracts/base.ts
apps/api/src/contracts/index.ts
apps/api/src/contracts/openapi.ts
apps/api/src/contracts/categories/get-categories.contract.ts
apps/api/src/contracts/products/create-product.contract.ts
apps/api/src/openapi/openapi.controller.ts
apps/api/src/openapi/openapi.module.ts
apps/seller/app/docs/page.tsx
test/contracts.spec.ts
```

### Updated:
```
apps/api/src/app.module.ts (added OpenApiModule)
apps/api/src/categories/categories.controller.ts (use contract)
apps/api/src/products/products.controller.ts (use contract)
```

---

**Status:** ✅ Production-Ready  
**Maintenance:** Minimal - just add contracts  
**Type Safety:** Full TypeScript support  
**Documentation:** Always in sync
