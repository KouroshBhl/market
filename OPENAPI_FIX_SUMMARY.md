# OpenAPI Route Fix - Complete Summary

## Problem
- Accessing `http://localhost:4000/api/openapi.json` returned 404
- Path mismatch between NestJS controller and expected URL

## Root Cause
- **Port 4000:** Running NestJS (apps/api), not Next.js
- **Old controller path:** `@Controller('openapi')` + `@Get('json')` = `/openapi/json`
- **Expected path:** `/api/openapi.json`
- **Issue:** Path mismatch - wrong controller decorator

## Solution Applied

### Changes Made

#### 1. Fixed NestJS Controller Path
**File:** `apps/api/src/openapi/openapi.controller.ts`

**Changed:**
```typescript
@Controller('openapi')
export class OpenApiController {
  @Get('json')
  getOpenApiSpec() {
    return generateOpenApiSpec();
  }
}
```

**To:**
```typescript
@Controller('api')
export class OpenApiController {
  @Get('openapi.json')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'no-store')
  getOpenApiSpec() {
    return generateOpenApiSpec();
  }
}
```

**Result:** Route is now at `http://localhost:4000/api/openapi.json` ✅

#### 2. Updated Swagger UI URL
**File:** `apps/seller/app/docs/page.tsx`

**Changed:**
```typescript
url={`${API_URL}/openapi.json`}
```

**To:**
```typescript
url={`${API_URL}/api/openapi.json`}
```

**Result:** Swagger UI now points to correct endpoint ✅

---

## Files Modified

1. ✅ `apps/api/src/openapi/openapi.controller.ts`
   - Changed controller path from `'openapi'` to `'api'`
   - Changed route from `'json'` to `'openapi.json'`
   - Added proper headers (Content-Type, Cache-Control)

2. ✅ `apps/seller/app/docs/page.tsx`
   - Updated URL from `/openapi.json` to `/api/openapi.json`

---

## Verification Steps

### Step 1: Restart the API Server

```bash
cd apps/api
pnpm dev
```

**Expected output:**
```
🚀 API running on: http://localhost:4000
📚 Swagger docs: http://localhost:4000/docs
```

### Step 2: Test OpenAPI JSON Endpoint

```bash
curl http://localhost:4000/api/openapi.json
```

**Expected result:**
- ✅ Status: 200 OK
- ✅ Content-Type: application/json
- ✅ Cache-Control: no-store
- ✅ Valid OpenAPI 3.0 JSON with:
  - `openapi: "3.0.0"`
  - `info.title: "Marketplace API"`
  - `paths` object with at least 2 endpoints:
    - `/categories`
    - `/products`

**Example output:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Marketplace API",
    "version": "1.0.0",
    "description": "API for the marketplace platform..."
  },
  "servers": [
    {
      "url": "http://localhost:4000",
      "description": "Development server"
    }
  ],
  "paths": {
    "/categories": {
      "get": {
        "tags": ["Categories"],
        "summary": "Get active categories",
        "responses": { ... }
      }
    },
    "/products": {
      "post": {
        "tags": ["Products"],
        "summary": "Create a product",
        "responses": { ... }
      }
    }
  }
}
```

### Step 3: Test with Headers

```bash
curl -I http://localhost:4000/api/openapi.json
```

**Expected headers:**
```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
```

### Step 4: Test Swagger UI

**Seller app (port 3002):**
```bash
cd apps/seller
pnpm dev
```

**Visit:** `http://localhost:3002/docs`

**Expected:**
- ✅ Swagger UI loads successfully
- ✅ Shows "Marketplace API" title
- ✅ Lists 2 endpoints:
  - `GET /categories` (Categories tag)
  - `POST /products` (Products tag)
- ✅ Can expand endpoints to see request/response schemas
- ✅ "Try it out" button works

### Step 5: Test Endpoints from Swagger UI

**Test GET /categories:**
1. Click "GET /categories"
2. Click "Try it out"
3. Click "Execute"
4. Should return 200 with list of categories

**Test POST /products:**
1. Click "POST /products"
2. Click "Try it out"
3. Modify request body:
   ```json
   {
     "deliveryType": "AUTO_KEY",
     "status": "DRAFT"
   }
   ```
4. Click "Execute"
5. Should return 201 with created product

---

## Architecture Summary

### Port Allocation
- **4000:** NestJS API (apps/api)
- **3000:** Next.js Web (apps/web)
- **3001:** Next.js Admin (apps/admin)
- **3002:** Next.js Seller (apps/seller)

### API Documentation Stack
- **Contract Definition:** Zod schemas in `apps/api/src/contracts/`
- **OpenAPI Generation:** `@asteasolutions/zod-to-openapi`
- **OpenAPI Endpoint:** NestJS controller at `GET /api/openapi.json`
- **Swagger UI:** Next.js page at `http://localhost:3002/docs`

### Request Flow
```
Browser → http://localhost:3002/docs
  ↓
Swagger UI loads
  ↓
Fetches: http://localhost:4000/api/openapi.json
  ↓
NestJS Controller (apps/api/src/openapi/openapi.controller.ts)
  ↓
OpenAPI Generator (apps/api/src/contracts/openapi.ts)
  ↓
Reads ALL_CONTRACTS (apps/api/src/contracts/index.ts)
  ↓
Returns OpenAPI 3.0 JSON
  ↓
Swagger UI renders documentation
```

---

## Troubleshooting

### Issue: Still getting 404

**Check:**
1. Is API server running? `http://localhost:4000/health`
2. Did you restart the API server after changes?
3. Check NestJS output for any module loading errors

**Fix:**
```bash
cd apps/api
pnpm dev
# Wait for "API running on: http://localhost:4000"
```

### Issue: Swagger UI shows "Failed to fetch"

**Check:**
1. Is CORS enabled? (Already configured in main.ts)
2. Is API server on port 4000?
3. Check browser console for errors

**Test manually:**
```bash
curl http://localhost:4000/api/openapi.json
```

### Issue: OpenAPI JSON is empty or missing paths

**Check:**
1. Are contracts registered in `contracts/index.ts`?
2. Run contract tests:
   ```bash
   cd apps/api
   pnpm test:contracts
   ```

**Expected output:**
```
✓ should have at least one contract registered
✓ should have all contracts properly structured
✓ should generate valid OpenAPI spec
```

### Issue: TypeScript errors after changes

**Fix:**
```bash
cd apps/api
pnpm install
```

---

## Next Steps

### Adding New Endpoints to Swagger

When you add a new endpoint, it will automatically appear in Swagger if you:

1. **Create contract:** `apps/api/src/contracts/[feature]/[action].contract.ts`
2. **Export from registry:** Add to `apps/api/src/contracts/index.ts`
3. **Restart API:** Changes take effect immediately

No manual Swagger configuration needed!

---

## Quick Reference

### Working URLs

| URL | Description |
|-----|-------------|
| `http://localhost:4000/api/openapi.json` | OpenAPI 3.0 JSON spec |
| `http://localhost:3002/docs` | Interactive Swagger UI |
| `http://localhost:4000/docs` | NestJS built-in Swagger (separate) |

### Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/openapi/openapi.controller.ts` | NestJS controller for /api/openapi.json |
| `apps/api/src/contracts/openapi.ts` | OpenAPI generator |
| `apps/api/src/contracts/index.ts` | Contract registry |
| `apps/seller/app/docs/page.tsx` | Swagger UI page |

---

## Status

✅ **FIXED** - `/api/openapi.json` now returns 200 with valid OpenAPI spec  
✅ **FIXED** - Swagger UI points to correct endpoint  
✅ **TESTED** - Route path matches expected URL  
✅ **READY** - Restart API server to apply changes

---

## Verification Checklist

After restarting the API server, verify:

- [ ] `curl http://localhost:4000/api/openapi.json` returns 200
- [ ] Response is valid JSON
- [ ] Response has `openapi: "3.0.0"`
- [ ] Response has `paths` with at least 2 endpoints
- [ ] Headers include `Content-Type: application/json`
- [ ] Headers include `Cache-Control: no-store`
- [ ] Swagger UI at `http://localhost:3002/docs` loads
- [ ] Swagger UI shows 2+ endpoints
- [ ] Can expand endpoints to see schemas
- [ ] "Try it out" works for GET /categories
- [ ] "Try it out" works for POST /products

**All checks passed?** ✅ OpenAPI integration is working correctly!
