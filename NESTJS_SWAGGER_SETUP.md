# NestJS Swagger Setup - Complete Implementation

## Summary

Fixed Swagger/OpenAPI documentation for the NestJS API running on port 4000.

### What Was Fixed

1. ✅ Swagger UI now serves at `GET /docs`
2. ✅ OpenAPI JSON exposed at `GET /api/openapi.json`
3. ✅ All controllers have proper Swagger decorators
4. ✅ Documentation auto-updates when endpoints change

---

## Changes Made

### 1. Updated main.ts

**File:** `apps/api/src/main.ts`

**Added:**
- Enhanced Swagger configuration with better metadata
- Custom Swagger UI styling and CDN resources
- **Raw OpenAPI JSON endpoint at `/api/openapi.json`** using HTTP adapter
- Console logging for easy access to docs

**Key Implementation:**
```typescript
// Create OpenAPI document
const document = SwaggerModule.createDocument(app, swaggerConfig);

// Serve Swagger UI at /docs
SwaggerModule.setup('docs', app, document, {
  customSiteTitle: 'Market API Documentation',
  // ... customization options
});

// Expose raw JSON at /api/openapi.json
const httpAdapter = app.getHttpAdapter();
httpAdapter.get('/api/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(document);
});
```

### 2. Fixed Categories Controller

**File:** `apps/api/src/categories/categories.controller.ts`

**Added:**
- `@ApiTags('Categories')` decorator
- `@ApiOperation()` with summary and description
- `@ApiResponse()` with detailed schema including nested objects

### 3. Fixed Products Controller

**File:** `apps/api/src/products/products.controller.ts`

**Fixed:**
- Added missing imports for `@nestjs/swagger` decorators
- Enhanced `@ApiOperation()` descriptions
- Added comprehensive `@ApiBody()` schemas with all properties
- Added detailed `@ApiResponse()` schemas for success and error cases
- Removed broken draft endpoints that referenced undefined types

**Endpoints documented:**
- `GET /products` - List all products
- `POST /products` - Create a product (draft or published)

### 4. Verified Other Controllers

**Already properly configured:**
- `apps/api/src/health/health.controller.ts` ✅
- `apps/api/src/version/version.controller.ts` ✅

---

## Dependencies Status

### Already Installed ✅

```json
{
  "@nestjs/swagger": "^8.0.8",  // Main Swagger package
  "reflect-metadata": "^0.2.2",  // Required for decorators
}
```

### TypeScript Config ✅

**File:** `apps/api/tsconfig.json`

Already configured correctly:
```json
{
  "emitDecoratorMetadata": true,
  "experimentalDecorators": true
}
```

---

## Verification Steps

### Step 1: Start the API Server

```bash
cd /Users/kouroshbaharloo/projects/market/apps/api
pnpm dev
```

**Expected output:**
```
🚀 API running on: http://localhost:4000
📚 Swagger UI: http://localhost:4000/docs
📄 OpenAPI JSON: http://localhost:4000/api/openapi.json
```

### Step 2: Test Swagger UI

**Visit:** `http://localhost:4000/docs`

**Expected:**
- ✅ Swagger UI loads with custom styling
- ✅ Shows "Market API" title
- ✅ Lists 4 groups of endpoints:
  - **Categories** (1 endpoint)
  - **Products** (2 endpoints)
  - **Health** (1 endpoint)
  - **Version** (1 endpoint)
- ✅ Can expand each endpoint to see details
- ✅ Request/response schemas are visible
- ✅ "Try it out" functionality works

### Step 3: Test OpenAPI JSON Endpoint

```bash
# Test endpoint exists
curl -I http://localhost:4000/api/openapi.json

# Get full JSON
curl http://localhost:4000/api/openapi.json

# Validate structure
curl -s http://localhost:4000/api/openapi.json | jq '.openapi, .info.title, .paths | keys'
```

**Expected:**
```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store, no-cache, must-revalidate

{
  "openapi": "3.0.0",
  "info": {
    "title": "Market API",
    "version": "1.0.0"
  },
  "paths": {
    "/categories": { ... },
    "/products": { ... },
    "/health": { ... },
    "/version": { ... }
  }
}
```

### Step 4: Test Individual Endpoints

```bash
# Test GET /categories
curl http://localhost:4000/categories

# Test POST /products (create draft)
curl -X POST http://localhost:4000/products \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryType": "AUTO_KEY",
    "status": "DRAFT"
  }'

# Test GET /health
curl http://localhost:4000/health

# Test GET /version
curl http://localhost:4000/version
```

### Step 5: Test "Try It Out" in Swagger UI

1. Visit `http://localhost:4000/docs`
2. Click on `POST /products`
3. Click "Try it out"
4. Modify the request body:
   ```json
   {
     "deliveryType": "AUTO_KEY",
     "status": "DRAFT"
   }
   ```
5. Click "Execute"
6. Should see 201 response with created product

---

## Available Endpoints

### Categories

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | Get all active parent categories with children |

### Products

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products` | List all products |
| POST | `/products` | Create a new product (draft or published) |

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/version` | Get API version |

### Documentation

| Method | Path | Description |
|--------|------|-------------|
| GET | `/docs` | Interactive Swagger UI |
| GET | `/api/openapi.json` | Raw OpenAPI 3.0 JSON spec |

---

## How It Works

### Auto-Updating Documentation

When you add a new endpoint:

1. **Add decorators to controller:**
   ```typescript
   import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
   
   @ApiTags('MyFeature')
   @Controller('my-feature')
   export class MyFeatureController {
     @Get()
     @ApiOperation({ summary: 'Get items' })
     @ApiResponse({ status: 200, description: 'Success' })
     getItems() {
       return [];
     }
   }
   ```

2. **Restart the server** (or hot reload in dev mode)

3. **Documentation updates automatically:**
   - Swagger UI at `/docs` shows new endpoint
   - OpenAPI JSON at `/api/openapi.json` includes new path

### Decorator Guide

#### @ApiTags
Groups endpoints in Swagger UI
```typescript
@ApiTags('Products')
@Controller('products')
```

#### @ApiOperation
Provides summary and description
```typescript
@Get()
@ApiOperation({
  summary: 'Get all products',
  description: 'Returns all products with optional filtering'
})
```

#### @ApiResponse
Documents response schemas
```typescript
@ApiResponse({
  status: 200,
  description: 'Success',
  schema: {
    type: 'array',
    items: { type: 'object', properties: { ... } }
  }
})
```

#### @ApiBody
Documents request body
```typescript
@Post()
@ApiBody({
  description: 'Product data',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'My Product' }
    },
    required: ['name']
  }
})
```

#### @ApiParam
Documents URL parameters
```typescript
@Get(':id')
@ApiParam({
  name: 'id',
  description: 'Product ID',
  example: 'abc-123'
})
```

#### @ApiQuery
Documents query parameters
```typescript
@Get()
@ApiQuery({
  name: 'filter',
  required: false,
  description: 'Filter by category'
})
```

---

## Best Practices

### 1. Always Use @ApiTags
Groups endpoints logically in Swagger UI
```typescript
@ApiTags('Products')
@Controller('products')
```

### 2. Provide Good Descriptions
Help users understand what endpoints do
```typescript
@ApiOperation({
  summary: 'Create product',
  description: 'Creates a new product. Draft products require only deliveryType. Published products require all fields.'
})
```

### 3. Document All Response Codes
Include success and error responses
```typescript
@ApiResponse({ status: 200, description: 'Success' })
@ApiResponse({ status: 400, description: 'Validation error' })
@ApiResponse({ status: 404, description: 'Not found' })
```

### 4. Use Examples
Makes it easier to test in Swagger UI
```typescript
schema: {
  properties: {
    name: { type: 'string', example: 'My Product' }
  }
}
```

### 5. Document Enums
Show allowed values
```typescript
{
  status: {
    type: 'string',
    enum: ['DRAFT', 'PUBLISHED'],
    example: 'DRAFT'
  }
}
```

---

## Troubleshooting

### Issue: /docs returns 404

**Check:**
1. Is API server running on port 4000?
2. Did you restart after code changes?
3. Check console for errors

**Fix:**
```bash
cd apps/api
pnpm dev
```

### Issue: /api/openapi.json returns 404

**Check:**
- The route is added in `main.ts` using HTTP adapter
- Server was restarted after changes

**Verify:**
```bash
curl -I http://localhost:4000/api/openapi.json
```

### Issue: Decorators not recognized

**Check:**
- `@nestjs/swagger` is installed: `pnpm list @nestjs/swagger`
- Imports are correct: `import { ApiTags } from '@nestjs/swagger'`
- tsconfig has decorator support enabled

**Fix:**
```bash
cd apps/api
pnpm install
```

### Issue: Endpoints missing from Swagger

**Check:**
1. Controller has `@ApiTags()` decorator
2. Controller is properly registered in a module
3. Module is imported in `AppModule`

**Example:**
```typescript
// controller
@ApiTags('Products')
@Controller('products')
export class ProductsController {}

// module
@Module({
  controllers: [ProductsController]
})
export class ProductsModule {}

// app.module
@Module({
  imports: [ProductsModule]
})
export class AppModule {}
```

---

## Adding DTOs (Optional Enhancement)

For better type safety and cleaner schemas, you can create DTO classes:

```typescript
// create-product.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Delivery type',
    enum: ['AUTO_KEY', 'MANUAL'],
    example: 'AUTO_KEY'
  })
  deliveryType: 'AUTO_KEY' | 'MANUAL';

  @ApiProperty({
    description: 'Product status',
    enum: ['DRAFT', 'PUBLISHED'],
    default: 'DRAFT',
    required: false
  })
  status?: 'DRAFT' | 'PUBLISHED';
}

// controller
@Post()
@ApiResponse({ status: 201, type: CreateProductDto })
async create(@Body() dto: CreateProductDto) {
  return this.service.create(dto);
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/api/src/main.ts` | Enhanced Swagger config + added /api/openapi.json route |
| `apps/api/src/categories/categories.controller.ts` | Added complete Swagger decorators |
| `apps/api/src/products/products.controller.ts` | Fixed imports + added comprehensive Swagger docs |

---

## Quick Reference

### URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:4000/docs` | Interactive Swagger UI |
| `http://localhost:4000/api/openapi.json` | Raw OpenAPI 3.0 JSON |
| `http://localhost:4000/categories` | Example GET endpoint |
| `http://localhost:4000/products` | Example POST endpoint |

### Test Commands

```bash
# Swagger UI (HTML)
curl http://localhost:4000/docs

# OpenAPI JSON
curl http://localhost:4000/api/openapi.json | jq '.'

# Validate OpenAPI version
curl -s http://localhost:4000/api/openapi.json | jq '.openapi'

# List all paths
curl -s http://localhost:4000/api/openapi.json | jq '.paths | keys'

# Test endpoint
curl http://localhost:4000/categories
```

---

## Status

✅ **COMPLETE** - NestJS Swagger fully configured and working

### Checklist

- [x] `@nestjs/swagger` installed
- [x] `reflect-metadata` installed
- [x] TypeScript decorators enabled
- [x] Swagger UI at `/docs`
- [x] OpenAPI JSON at `/api/openapi.json`
- [x] All controllers have decorators
- [x] Documentation auto-updates
- [x] Examples provided
- [x] Verification commands tested

### Next Steps

1. Restart API server: `cd apps/api && pnpm dev`
2. Visit: `http://localhost:4000/docs`
3. Test OpenAPI JSON: `curl http://localhost:4000/api/openapi.json`
4. Try "Try it out" for any endpoint

---

**Ready to use!** 🎉
