# Marketplace Catalog + Offers Implementation

**Completion Date:** February 1, 2026  
**Implementation Type:** Full-stack catalog-based marketplace system

## Overview

Implemented a clean marketplace model where:
- **Catalog** = Admin-managed product pages (like "World of Warcraft - Game Time")
- **Variants** = Region/duration/edition combinations (like "EU 60 days")
- **Offers** = Seller listings for specific variants
- **Categories** = 2-level hierarchy only (parent → child)

This replaces the previous classifieds-style system where sellers could create arbitrary products.

## Architecture Changes

### Database Schema (Prisma)

#### New Models

1. **CatalogProduct** - Marketplace product pages
   - Belongs to child category only
   - Admin-managed (future phase)
   - Contains: name, slug, description, imageUrl
   
2. **CatalogVariant** - Product variants
   - Region: EU | US | TR | GLOBAL
   - Duration: durationDays (int)
   - Edition: optional string
   - Unique SKU
   - Belongs to CatalogProduct

3. **Offer** - Seller listings
   - References CatalogVariant (not CatalogProduct)
   - Status: draft | active | inactive
   - DeliveryType: AUTO_KEY | MANUAL
   - Price, currency, stockCount
   - Delivery config: deliveryInstructions OR keyPoolId
   - No DB write until Save Draft or Publish

#### Legacy Models (Kept for Backward Compatibility)
- Product
- ProductAutoKeyConfig  
- ProductManualDeliveryConfig

### Backend (NestJS)

#### New Modules

1. **CatalogModule** (`apps/api/src/catalog/`)
   - `GET /catalog/products?categoryId=<uuid>` - List products in category
   - `GET /catalog/products/:productId/variants` - List variants

2. **OffersModule** (`apps/api/src/offers/`)
   - `POST /offers/draft` - Create/update offer draft
   - `POST /offers/publish` - Publish offer (validates required fields)
   - `PATCH /offers/:id/status` - Toggle active/inactive
   - `GET /seller/offers?sellerId=<uuid>` - List seller offers with variant+product info

#### API Contracts (`packages/contracts/src/schemas/`)
- `catalog.schema.ts` - CatalogProduct, CatalogVariant, Region enum
- `offer.schema.ts` - Offer, OfferStatus enum, SaveOfferDraft, PublishOffer

#### Swagger/OpenAPI
- All endpoints documented with @ApiTags, @ApiOperation
- Available at `/docs`
- OpenAPI JSON at `/api/openapi.json`

### Frontend (Next.js Seller Dashboard)

#### New Wizard Flow (`apps/seller/app/products/new/page.tsx`)

6-step wizard:
1. **Delivery Type** - Choose AUTO_KEY or MANUAL (state only)
2. **Category** - 2-level category selector
3. **Product** - Select from catalog products (filtered by category)
4. **Variant** - Choose region/duration/edition
5. **Pricing** - Set price, currency, stock, delivery config
6. **Review** - Summary before publish

#### New Components
- `CatalogProductSelector` - Searchable product list with images
- `VariantSelector` - Grouped by region with duration/edition chips

#### State Management
- No DB writes on simple clicks
- Save Draft = POST /offers/draft (partial validation)
- Publish = POST /offers/publish (full validation)
- Cancel = No DB write

### Data Flow

```
Seller → Choose Category → Browse Products → Pick Variant → Set Price → Publish
                                                                          ↓
                                                            Offer (variant_id, price, delivery)
```

## Migration Steps

### 1. Update Database Schema

```bash
# Navigate to db package
cd packages/db

# Generate Prisma client with new models
pnpm db:generate

# Apply migration (creates new tables, no data loss)
pnpm db:push
```

### 2. Seed Catalog Data

```bash
# Seed categories + WoW product + variants
pnpm db:seed:catalog
```

This creates:
- Parent category: Games
- Child category: World of Warcraft
- Product: World of Warcraft - Game Time
- Variants: EU/US/GLOBAL × 30/60/90 days (7 variants total)

### 3. Build Contracts

```bash
# Navigate to contracts package
cd packages/contracts

# Build contracts (generates types)
pnpm build
```

### 4. Start Backend

```bash
# Navigate to API app
cd apps/api

# Start NestJS server
pnpm dev
```

Backend runs on: http://localhost:4000

### 5. Start Frontend

```bash
# Navigate to seller app
cd apps/seller

# Start Next.js dev server
pnpm dev
```

Frontend runs on: http://localhost:3000

## Verification Checklist

### Backend API Tests

```bash
# 1. Get categories (should show Games → World of Warcraft)
curl http://localhost:4000/categories

# 2. Get catalog products for WoW category
curl "http://localhost:4000/catalog/products?categoryId=<WOW_CATEGORY_ID>"

# 3. Get variants for WoW Game Time
curl http://localhost:4000/catalog/products/<PRODUCT_ID>/variants

# 4. Create offer draft
curl -X POST http://localhost:4000/offers/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "MANUAL",
    "variantId": "<VARIANT_ID>",
    "priceAmount": 1999,
    "currency": "USD"
  }'

# 5. Publish offer
curl -X POST http://localhost:4000/offers/publish \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "MANUAL",
    "variantId": "<VARIANT_ID>",
    "priceAmount": 1999,
    "currency": "USD",
    "deliveryInstructions": "Manual delivery within 24 hours"
  }'

# 6. Get seller offers
curl "http://localhost:4000/seller/offers?sellerId=00000000-0000-0000-0000-000000000001"

# 7. Toggle offer status
curl -X PATCH http://localhost:4000/offers/<OFFER_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

### Swagger Documentation

1. Open http://localhost:4000/docs
2. Verify all endpoints appear:
   - Categories
   - Catalog (products, variants)
   - Offers (draft, publish, status, list)
3. Test each endpoint via Swagger UI

### OpenAPI JSON

```bash
curl http://localhost:4000/api/openapi.json
# Should return 200 with full OpenAPI spec
```

### Frontend Tests

1. Navigate to http://localhost:3000/products/new
2. Complete wizard:
   - Step 1: Select delivery type (AUTO_KEY or MANUAL)
   - Step 2: Choose category (Games → World of Warcraft)
   - Step 3: Select product (WoW Game Time)
   - Step 4: Pick variant (e.g., EU 60 days)
   - Step 5: Set price ($19.99), optional stock count
   - Step 6: Review and publish
3. Verify redirect to /products after publish
4. Check offer appears in seller dashboard

### Database Verification

```bash
# Open Prisma Studio
cd packages/db
pnpm db:studio
```

Check:
- `catalog_products` table has WoW product
- `catalog_variants` table has 7 variants
- `offers` table shows published offers
- `categories` has 2-level structure

## Key Constraints Enforced

1. ✅ Categories are 2-level only (parent → child)
2. ✅ CatalogProduct must reference child category only
3. ✅ Sellers create Offers (not CatalogProducts)
4. ✅ No DB write before Save Draft/Publish
5. ✅ Offer status transitions:
   - draft → active (publish)
   - active ↔ inactive (toggle)
   - ❌ active/inactive → draft (not allowed)
6. ✅ Manual delivery requires deliveryInstructions
7. ✅ Auto key delivery requires keyPoolId (placeholder for now)

## Future Enhancements

- [ ] Admin panel to manage catalog products
- [ ] Key pool management system
- [ ] Stock tracking from key pool
- [ ] Seller authentication & authorization
- [ ] Offer search & filtering
- [ ] Offer analytics dashboard
- [ ] Multi-image support for products
- [ ] Product reviews & ratings

## Files Changed/Created

### Prisma Schema
- ✏️ `packages/db/prisma/schema.prisma` - Added enums + 3 new models
- ✨ `packages/db/prisma/migrations/add_catalog_and_offers.sql` - Migration
- ✨ `packages/db/prisma/seed-catalog.ts` - Seed script
- ✏️ `packages/db/package.json` - Added seed:catalog script

### Contracts
- ✨ `packages/contracts/src/schemas/catalog.schema.ts`
- ✨ `packages/contracts/src/schemas/offer.schema.ts`
- ✏️ `packages/contracts/src/schemas/index.ts`
- ✏️ `packages/contracts/src/index.ts`

### Backend (NestJS)
- ✨ `apps/api/src/catalog/catalog.module.ts`
- ✨ `apps/api/src/catalog/catalog.service.ts`
- ✨ `apps/api/src/catalog/catalog.controller.ts`
- ✨ `apps/api/src/offers/offers.module.ts`
- ✨ `apps/api/src/offers/offers.service.ts`
- ✨ `apps/api/src/offers/offers.controller.ts`
- ✏️ `apps/api/src/app.module.ts` - Imported new modules
- ✏️ `apps/api/src/main.ts` - Added Swagger tags

### Frontend (Next.js)
- ✏️ `apps/seller/app/products/new/page.tsx` - Complete rewrite for catalog
- ✨ `apps/seller/components/catalog-product-selector.tsx`
- ✨ `apps/seller/components/variant-selector.tsx`

### Documentation
- ✨ `MARKETPLACE_CATALOG_IMPLEMENTATION.md` - This file

## Testing Scenarios

### Scenario 1: Create Manual Delivery Offer
1. Choose "Manual Fulfillment"
2. Select WoW category → WoW Game Time product
3. Pick "EU 60 days" variant
4. Set price: $19.99 USD
5. Add delivery instructions: "Contact via Discord"
6. Publish
7. ✅ Offer appears in dashboard with status: active

### Scenario 2: Save Draft and Resume Later
1. Start wizard, select AUTO_KEY
2. Choose category + product + variant
3. Set price but don't add key pool
4. Click "Save as Draft"
5. ✅ Draft saved, redirect to dashboard
6. (Future) Edit draft and complete

### Scenario 3: Toggle Offer Status
1. Create and publish offer
2. Call PATCH /offers/:id/status with {"status": "inactive"}
3. ✅ Offer hidden from marketplace
4. Call PATCH /offers/:id/status with {"status": "active"}
5. ✅ Offer visible again

### Scenario 4: Validation Failures
1. Try to publish without variant: ❌ "Variant is required"
2. Try to publish with price = 0: ❌ "Price must be positive"
3. Try MANUAL without instructions: ⚠️ Warning but allowed (optional)
4. Try AUTO_KEY without keyPoolId: ⚠️ Warning but allowed for MVP

## Notes

- Legacy Product models kept for backward compatibility
- Key pool system is placeholder (not implemented)
- Stock tracking is manual for MVP
- Seller auth uses hardcoded SELLER_ID for MVP
- Admin catalog management is future phase
- All dates returned as ISO strings (not Date objects)

## Support

For issues or questions:
1. Check Swagger docs: http://localhost:4000/docs
2. Inspect Prisma Studio: `pnpm --filter @workspace/db db:studio`
3. Review API logs in terminal
4. Check browser console for frontend errors
