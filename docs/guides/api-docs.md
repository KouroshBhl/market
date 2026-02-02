# API Documentation with Swagger

## Overview

This marketplace API provides interactive documentation using Swagger/OpenAPI, with automatic updates when you add new endpoints.

## Access Documentation

| URL | Purpose |
|-----|---------|
| `http://localhost:4000/docs` | Interactive Swagger UI |
| `http://localhost:4000/api/openapi.json` | Raw OpenAPI 3.0 JSON |

## Quick Start

### 1. Start the API Server

```bash
cd apps/api
pnpm dev
```

**Expected output:**
```
🚀 API running on: http://localhost:4000
📚 Swagger UI: http://localhost:4000/docs
📄 OpenAPI JSON: http://localhost:4000/api/openapi.json
```

### 2. Test Swagger UI

Visit `http://localhost:4000/docs`

You should see:
- ✅ Swagger UI with custom styling
- ✅ "Market API" title
- ✅ Endpoint groups: Categories, Products, Catalog, Offers, Health, Version
- ✅ Expandable endpoints with request/response schemas
- ✅ "Try it out" functionality

### 3. Test OpenAPI JSON Endpoint

```bash
curl -s http://localhost:4000/api/openapi.json | jq '.openapi, .info.title'
```

**Expected:**
```json
"3.0.0"
"Market API"
```

## How It Works

When you add a new endpoint, documentation updates automatically if you:

1. Add decorators to your controller
2. Restart the API server
3. Refresh Swagger UI

### Essential Decorators

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

## Decorator Guide

### @ApiTags
Groups endpoints in Swagger UI
```typescript
@ApiTags('Products')
@Controller('products')
```

### @ApiOperation
Provides summary and description
```typescript
@Get()
@ApiOperation({
  summary: 'Get all products',
  description: 'Returns all products with optional filtering'
})
```

### @ApiResponse
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

### @ApiBody
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

### @ApiParam
Documents URL parameters
```typescript
@Get(':id')
@ApiParam({
  name: 'id',
  description: 'Product ID',
  example: 'abc-123'
})
```

### @ApiQuery
Documents query parameters
```typescript
@Get()
@ApiQuery({
  name: 'filter',
  required: false,
  description: 'Filter by category'
})
```

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
  description: 'Creates a new product. Draft products require only deliveryType.'
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

## Dependencies

Already installed in the API app:

```json
{
  "@nestjs/swagger": "^8.0.8",
  "reflect-metadata": "^0.2.2"
}
```

## TypeScript Configuration

**apps/api/tsconfig.json** is already configured:

```json
{
  "emitDecoratorMetadata": true,
  "experimentalDecorators": true
}
```

## Test Commands

```bash
# Swagger UI (HTML)
curl http://localhost:4000/docs

# OpenAPI JSON
curl http://localhost:4000/api/openapi.json | jq '.'

# Validate OpenAPI version
curl -s http://localhost:4000/api/openapi.json | jq '.openapi'

# List all paths
curl -s http://localhost:4000/api/openapi.json | jq '.paths | keys'
```

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
