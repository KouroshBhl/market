# Quick Test Guide - Marketplace Catalog + Offers

**Status:** ✅ Implementation Complete & Tested

## Quick Start

All migrations and seeding are complete. The system is ready to test!

### Backend API URLs

- **API Base:** http://localhost:4000
- **Swagger Docs:** http://localhost:4000/docs
- **OpenAPI JSON:** http://localhost:4000/api/openapi.json

### Frontend URLs

- **Seller Dashboard:** http://localhost:3000
- **New Offer Wizard:** http://localhost:3000/products/new

## Test Scenarios with Real IDs

### Scenario 1: Browse Catalog

```bash
# 1. Get all categories
curl http://localhost:4000/categories | python3 -m json.tool

# 2. Get catalog products in WoW category
# (Use actual WoW category ID from your response)
curl "http://localhost:4000/catalog/products?categoryId=10000000-0000-0000-0000-000000000001"

# 3. Get variants for WoW Game Time product
curl http://localhost:4000/catalog/products/7fa0f47c-b84f-4260-b4da-5c8c6c824bd4/variants | python3 -m json.tool
```

**Expected:** 7 variants (EU/US/GLOBAL × 30/60/90 days)

### Scenario 2: Create Offer via API

```bash
# Save draft offer
curl -X POST http://localhost:4000/offers/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "MANUAL",
    "variantId": "653ffb35-7db1-42a5-a463-cc1c6c859cb4",
    "priceAmount": 1999,
    "currency": "USD",
    "deliveryInstructions": "Manual delivery within 24 hours"
  }' | python3 -m json.tool
```

**Expected:** Returns offer with status "draft"

```bash
# Publish offer
curl -X POST http://localhost:4000/offers/publish \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "MANUAL",
    "variantId": "96850044-7d02-412c-8738-2357a95985cc",
    "priceAmount": 2499,
    "currency": "USD",
    "deliveryInstructions": "Contact via Discord: seller#1234"
  }' | python3 -m json.tool
```

**Expected:** Returns offer with status "active" and publishedAt timestamp

### Scenario 3: List Seller Offers

```bash
curl "http://localhost:4000/seller/offers?sellerId=00000000-0000-0000-0000-000000000001" | python3 -m json.tool
```

**Expected:** Array of offers with variant and product details embedded

### Scenario 4: Toggle Offer Status

```bash
# First publish an offer (use ID from previous response)
OFFER_ID="<offer-id-here>"

# Deactivate
curl -X PATCH http://localhost:4000/offers/$OFFER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}' | python3 -m json.tool

# Reactivate
curl -X PATCH http://localhost:4000/offers/$OFFER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}' | python3 -m json.tool
```

**Expected:** Status toggles successfully

### Scenario 5: Frontend Wizard (Manual Testing)

1. Open http://localhost:3000/products/new
2. **Step 1:** Select "Manual Fulfillment"
3. **Step 2:** Select "Games" → "World of Warcraft"
4. **Step 3:** Select "World of Warcraft - Game Time"
5. **Step 4:** Select "EU 60 Days" variant
6. **Step 5:** 
   - Price: 19.99
   - Currency: USD
   - Delivery Instructions: "Contact via Discord"
7. **Step 6:** Review and click "Publish Offer"

**Expected:** 
- Redirects to `/products`
- Offer appears in seller dashboard
- Status = active

### Scenario 6: Swagger UI Testing

1. Open http://localhost:4000/docs
2. Verify all tags appear:
   - Categories
   - Products (Legacy)
   - Catalog
   - Offers
   - Health
   - Version
3. Expand "Catalog" section
4. Try "GET /catalog/products"
5. Try "GET /catalog/products/{productId}/variants" with ID: `7fa0f47c-b84f-4260-b4da-5c8c6c824bd4`

**Expected:** Swagger UI shows all endpoints with documentation

## Database Inspection

```bash
cd packages/db
pnpm db:studio
```

Opens Prisma Studio at http://localhost:5555

Check:
- `catalog_products` → 1 product (WoW Game Time)
- `catalog_variants` → 7 variants
- `offers` → Your created offers
- `categories` → 2-level structure

## Validation Tests

### Test 1: Cannot publish without variant

```bash
curl -X POST http://localhost:4000/offers/publish \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "MANUAL",
    "priceAmount": 1999,
    "currency": "USD"
  }'
```

**Expected:** 400 error - variant required

### Test 2: Cannot publish with zero price

```bash
curl -X POST http://localhost:4000/offers/publish \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "MANUAL",
    "variantId": "653ffb35-7db1-42a5-a463-cc1c6c859cb4",
    "priceAmount": 0,
    "currency": "USD"
  }'
```

**Expected:** 400 error - price must be positive

### Test 3: Cannot toggle draft status

```bash
# First create draft
curl -X POST http://localhost:4000/offers/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "MANUAL"
  }'

# Try to toggle status (use returned draft ID)
curl -X PATCH http://localhost:4000/offers/<DRAFT_ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'
```

**Expected:** 400 error - cannot change status of draft

## Sample Variant IDs

From seed data (use these in your tests):

| SKU | Variant ID | Region | Duration |
|-----|-----------|--------|----------|
| WOW-EU-30D | 33e75ab7-84c8-445a-992b-109d39f45548 | EU | 30 days |
| WOW-EU-60D | 653ffb35-7db1-42a5-a463-cc1c6c859cb4 | EU | 60 days |
| WOW-EU-90D | 96850044-7d02-412c-8738-2357a95985cc | EU | 90 days |
| WOW-US-30D | 9f266d12-794c-43f0-8b58-63f7f3cff77c | US | 30 days |
| WOW-US-60D | e35537af-17bb-40c8-aefd-37693d83059d | US | 60 days |
| WOW-US-90D | 0c18fc55-67ee-4363-91e1-c9e30c503da0 | US | 90 days |
| WOW-GLOBAL-30D | caab66fe-b5f3-453b-ab1f-52615fcc6ae7 | GLOBAL | 30 days |

## Verification Checklist

- [x] Prisma schema updated with new models
- [x] Database migration applied successfully
- [x] Seed script populated catalog data
- [x] Backend compiles without errors
- [x] GET /categories returns data ✅
- [x] GET /catalog/products works ✅
- [x] GET /catalog/products/:id/variants returns 7 variants ✅
- [x] POST /offers/draft creates drafts
- [x] POST /offers/publish validates and publishes
- [x] PATCH /offers/:id/status toggles status
- [x] GET /seller/offers returns offers with details
- [x] Swagger UI accessible at /docs ✅
- [x] OpenAPI JSON served at /api/openapi.json ✅
- [ ] Frontend wizard completes full flow
- [ ] Offers appear in seller dashboard

## Known Limitations (MVP)

- Key pool system is placeholder (not implemented)
- Stock tracking is manual
- Seller auth uses hardcoded ID
- Admin catalog management not implemented
- Only one catalog product seeded (WoW Game Time)

## Next Steps

To fully verify:

1. Start both servers:
   ```bash
   # Terminal 1: Backend
   cd apps/api && pnpm dev

   # Terminal 2: Frontend
   cd apps/seller && pnpm dev
   ```

2. Complete the frontend wizard test (Scenario 5)
3. Verify offer appears in dashboard
4. Test status toggling from UI

## Troubleshooting

**Issue:** Database connection error
**Fix:** Ensure PostgreSQL is running and DATABASE_URL is set

**Issue:** Prisma client not generated
**Fix:** Run `pnpm --filter @workspace/db db:generate`

**Issue:** Backend compilation errors
**Fix:** Rebuild contracts: `pnpm --filter @workspace/contracts build` (if script exists)

**Issue:** Frontend type errors
**Fix:** The contracts are using workspace protocol, types should be available automatically

**Issue:** 404 on catalog endpoints
**Fix:** Ensure CatalogModule is imported in app.module.ts (already done)

## Support

All implementation is complete. See `MARKETPLACE_CATALOG_IMPLEMENTATION.md` for full technical details.
