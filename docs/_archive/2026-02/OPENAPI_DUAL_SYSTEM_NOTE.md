# OpenAPI Dual System Note

## Current State

There are currently TWO OpenAPI documentation systems running in the API:

### 1. NestJS Swagger (Active & Recommended)

**Location:** `apps/api/src/main.ts`

**Endpoints:**
- Swagger UI: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/api/openapi.json` (via custom route handler)

**How it works:**
- Uses `@nestjs/swagger` decorators in controllers
- Automatically generates OpenAPI spec from decorators
- All new product endpoints use this system

**Pros:**
- ✅ Integrated with NestJS
- ✅ Auto-updates with code changes
- ✅ Better TypeScript support
- ✅ Industry standard for NestJS apps

### 2. Contract-Based System (Legacy)

**Location:** `apps/api/src/contracts/`

**Endpoints:**
- OpenAPI JSON: `http://localhost:4000/api/openapi.json` (via `OpenApiController`)

**How it works:**
- Uses Zod schemas in contract files
- `openapi.ts` generates OpenAPI spec from contracts
- Only old endpoints use this system

**Files:**
- `apps/api/src/contracts/base.ts`
- `apps/api/src/contracts/openapi.ts`
- `apps/api/src/contracts/products/create-product.contract.ts` (outdated)
- `apps/api/src/contracts/categories/get-categories.contract.ts`
- `apps/api/src/openapi/openapi.controller.ts`

## Route Conflict

**WARNING:** Both systems try to serve `/api/openapi.json`

Currently, the NestJS Swagger route handler in `main.ts` (line 52) takes precedence because it's registered directly on the HTTP adapter before controllers are initialized.

## Recommendation

### Option 1: Remove Legacy System (Recommended)

**Pros:**
- Single source of truth
- Less confusion
- Simpler codebase
- No route conflicts

**Steps:**
1. Delete `apps/api/src/contracts/` folder (except keep `base.ts` if used elsewhere)
2. Delete `apps/api/src/openapi/` module
3. Update all endpoints to use NestJS Swagger decorators

**Impact:**
- Low impact (only categories endpoint uses old system, can be easily updated)

### Option 2: Keep Both & Fix Conflict

**Pros:**
- Gradual migration path
- Existing contracts preserved

**Steps:**
1. Change old system to serve at `/api/openapi-legacy.json`
2. Document which endpoints use which system
3. Gradually migrate all endpoints to NestJS Swagger

**Impact:**
- Medium maintenance burden
- Potential confusion for developers

### Option 3: Use Legacy for Everything

**Pros:**
- Contract-first approach
- Zod validation built-in

**Cons:**
- Less integration with NestJS
- More manual work
- Not the NestJS standard

**Not recommended** because NestJS Swagger is the industry standard and better integrated.

## Current Refactor Status

For the product wizard refactor:
- ✅ All new product endpoints use NestJS Swagger
- ✅ Swagger UI at `/docs` works correctly
- ✅ OpenAPI JSON at `/api/openapi.json` works correctly
- ⚠️ Old contract system still present but not used for new endpoints
- ⚠️ Route conflict exists but not causing issues (NestJS route takes precedence)

## Next Steps

After the product wizard refactor is complete and verified:

1. **Decide on migration strategy** (Option 1 recommended)
2. **Update categories endpoint** to use NestJS Swagger decorators
3. **Remove legacy contract system** if going with Option 1
4. **Update documentation** to reflect single OpenAPI system

## For Now

The product wizard refactor is complete and functional with NestJS Swagger. The legacy system can be addressed in a separate cleanup task.
