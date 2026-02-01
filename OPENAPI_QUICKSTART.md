# OpenAPI Fix - Quick Start

## What Was Fixed

The route `/api/openapi.json` was returning 404 because of a path mismatch in the NestJS controller.

## Changes Applied

### 1. NestJS Controller Path
**File:** `apps/api/src/openapi/openapi.controller.ts`

```diff
- @Controller('openapi')
+ @Controller('api')
  export class OpenApiController {
-   @Get('json')
+   @Get('openapi.json')
+   @Header('Content-Type', 'application/json')
+   @Header('Cache-Control', 'no-store')
    getOpenApiSpec() {
      return generateOpenApiSpec();
    }
  }
```

**Result:** Route is now `http://localhost:4000/api/openapi.json` ✅

### 2. Swagger UI URL
**File:** `apps/seller/app/docs/page.tsx`

```diff
- url={`${API_URL}/openapi.json`}
+ url={`${API_URL}/api/openapi.json`}
```

**Result:** Swagger UI points to correct endpoint ✅

---

## Verification (Do This Now!)

### Step 1: Restart API Server

```bash
cd apps/api
pnpm dev
```

Wait for: `🚀 API running on: http://localhost:4000`

### Step 2: Test OpenAPI Endpoint

```bash
curl http://localhost:4000/api/openapi.json
```

**Expected:** JSON response with `openapi: "3.0.0"` and at least 2 paths

### Step 3: Test Swagger UI

```bash
# In another terminal
cd apps/seller
pnpm dev
```

Visit: `http://localhost:3002/docs`

**Expected:** 
- Swagger UI loads
- Shows "Marketplace API"
- Lists GET /categories and POST /products

---

## Quick Test Commands

```bash
# Test 1: OpenAPI JSON exists
curl -I http://localhost:4000/api/openapi.json
# Expected: HTTP/1.1 200 OK

# Test 2: Valid JSON content
curl http://localhost:4000/api/openapi.json | jq '.openapi'
# Expected: "3.0.0"

# Test 3: Has paths
curl http://localhost:4000/api/openapi.json | jq '.paths | keys'
# Expected: ["/categories", "/products"]

# Test 4: Categories endpoint works
curl http://localhost:4000/categories
# Expected: JSON with parents array

# Test 5: Create draft product
curl -X POST http://localhost:4000/products \
  -H "Content-Type: application/json" \
  -d '{"deliveryType":"AUTO_KEY","status":"DRAFT"}'
# Expected: 201 with product JSON
```

---

## Files Changed

✅ `apps/api/src/openapi/openapi.controller.ts` - Fixed route path  
✅ `apps/seller/app/docs/page.tsx` - Updated Swagger UI URL  
✅ `CONTRACT_FIRST_API_GUIDE.md` - Updated documentation  
✅ `CONTRACT_API_SETUP.md` - Updated documentation

---

## What You Get Now

| URL | What It Does |
|-----|--------------|
| `http://localhost:4000/api/openapi.json` | Returns OpenAPI 3.0 JSON spec |
| `http://localhost:3002/docs` | Shows interactive Swagger UI |
| `http://localhost:4000/categories` | Example GET endpoint |
| `http://localhost:4000/products` | Example POST endpoint |

---

## Troubleshooting

### Still getting 404?

1. **Restart API server** - Changes require restart
2. **Check port** - API should be on 4000
3. **Check logs** - Look for errors in terminal

### Swagger UI not loading?

1. **Check API is running** on port 4000
2. **Check Seller is running** on port 3002
3. **Clear browser cache**
4. **Check browser console** for errors

---

## Status: ✅ READY TO TEST

Restart the API server and test the URLs above!
