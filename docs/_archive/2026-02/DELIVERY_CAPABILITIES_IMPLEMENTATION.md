# Delivery Capabilities Implementation

## Summary

Successfully implemented delivery capabilities at the CatalogVariant level with full validation across the stack (Prisma → NestJS → Next.js).

## Changes Made

### A) Database Schema (Prisma)

**File: `packages/db/prisma/schema.prisma`**

1. **CatalogVariant Model Updates:**
   - Added `supportsAutoKey: Boolean @default(false)` - Indicates if variant supports automated key delivery
   - Added `supportsManual: Boolean @default(true)` - Indicates if variant supports manual delivery
   - Note: `categoryId` is correctly on CatalogProduct only (no changes needed)
   
2. **Offer Model Updates:**
   - Added index on `variantId` for better query performance
   - `deliveryType` enum was already present (AUTO_KEY, MANUAL)

3. **Migration:**
   - Ran `prisma db push` to apply schema changes
   - Database synchronized successfully

### B) Backend (NestJS + Prisma)

**Files Modified:**

1. **`packages/contracts/src/schemas/catalog.schema.ts`**
   - Updated `CatalogVariantSchema` to include `supportsAutoKey` and `supportsManual` fields

2. **`packages/contracts/src/schemas/offer.schema.ts`**
   - Made `deliveryType` optional in `SaveOfferDraftSchema` (can be null initially for progressive saves)
   - Kept validation strict for `PublishOfferSchema`

3. **`apps/api/src/catalog/catalog.service.ts`**
   - Updated `mapVariantToContract()` to include delivery capability fields

4. **`apps/api/src/offers/offers.service.ts`**
   - Added `validateDeliveryCapability()` method to enforce variant delivery rules
   - Updated `saveDraft()` to validate capabilities when both variant and deliveryType are provided
   - Updated `publish()` with strict validation:
     - Checks if variant supports the selected delivery type
     - Validates MANUAL requires `deliveryInstructions`
     - Validates AUTO_KEY requires `keyPoolId` or `stockCount` (MVP)
   - Returns clear 400 errors with descriptive messages (e.g., "Variant WOW-GT-EU-30D does not support auto-key delivery")

**Validation Rules Enforced:**
- If `supportsAutoKey=false`, offers using `AUTO_KEY` are rejected (400)
- If `supportsManual=false`, offers using `MANUAL` are rejected (400)
- Variants with neither supported are filtered out (should be `isActive=false`)

**Swagger/OpenAPI:**
- Already configured at `/docs` (Swagger UI)
- OpenAPI JSON available at `/api/openapi.json`
- All endpoints use `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators
- DTOs are properly validated with Zod schemas

### C) Frontend (Next.js Seller Wizard)

**File: `apps/seller/app/products/new/page.tsx`**

**Flow Refactored:**
- **Old Flow:** Delivery Type → Category → Product → Variant → Pricing → Review
- **New Flow:** Category → Product → Variant → Delivery Type → Pricing → Review

**Key Changes:**
1. **Variant Selection First:** Seller selects variant before choosing delivery type
2. **Auto-Selection Logic:**
   - If variant supports only one delivery type, it's automatically selected
   - If both are supported, seller chooses
   - If neither is supported (edge case), error is displayed
3. **Delivery Type UI:**
   - Cards are disabled/enabled based on `supportsAutoKey` and `supportsManual`
   - Visual indicator shows which delivery methods are available for selected variant
4. **Validation:**
   - Invalid delivery type selections are blocked before API call
   - Backend validation provides fallback error handling

**useEffect Hook:**
- Watches `selectedVariant?.id` changes
- Auto-selects delivery type if only one option is available
- Resets invalid selections when variant changes

### D) Seed Data

**File: `packages/db/prisma/seed.ts`**

Added 5 WoW Game Time variants with different delivery capabilities:

| SKU | Region | Duration | Auto-Key | Manual | Notes |
|-----|--------|----------|----------|--------|-------|
| WOW-GT-EU-60D | EU | 60 days | ✓ | ✓ | Both methods supported |
| WOW-GT-EU-30D | EU | 30 days | ✗ | ✓ | Manual only |
| WOW-GT-US-60D | US | 60 days | ✓ | ✓ | Both methods supported |
| WOW-GT-US-30D | US | 30 days | ✗ | ✓ | Manual only |
| WOW-GT-GLOBAL-90D | GLOBAL | 90 days | ✓ | ✗ | Auto-key only |

**Script: `packages/db/scripts/update-old-variants.ts`**
- Created utility script to update pre-existing variants with default capabilities (both true)

## Verification Checklist

### Backend API Tests

**Note: Backend dev server needs to be restarted for Prisma schema changes to take effect.**

```bash
# 1. Restart the backend (required!)
cd apps/api
pnpm dev

# 2. Test GET /catalog/products/:productId/variants
curl http://localhost:4000/catalog/products/7fa0f47c-b84f-4260-b4da-5c8c6c824bd4/variants | jq '.variants[0]'

# Expected: Response includes supportsAutoKey and supportsManual fields

# 3. Test POST /offers/draft with invalid delivery type
curl -X POST http://localhost:4000/offers/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "variantId": "v0000000-0000-0000-0000-000000000002",
    "deliveryType": "AUTO_KEY",
    "priceAmount": 1000,
    "currency": "USD"
  }'

# Expected: 400 error - "Variant WOW-GT-EU-30D does not support auto-key delivery"

# 4. Test POST /offers/publish with valid delivery type
curl -X POST http://localhost:4000/offers/publish \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "variantId": "v0000000-0000-0000-0000-000000000002",
    "deliveryType": "MANUAL",
    "priceAmount": 1000,
    "currency": "USD",
    "deliveryInstructions": "Will be delivered within 24 hours"
  }'

# Expected: 201 success - Offer created

# 5. Test Swagger UI
open http://localhost:4000/docs

# 6. Test OpenAPI JSON
curl http://localhost:4000/api/openapi.json

# Expected: 200 with valid OpenAPI spec
```

### Frontend UI Tests

```bash
# Start the seller dashboard
cd apps/seller
pnpm dev

# Navigate to: http://localhost:3000/products/new

# Test Cases:
# 1. Select WOW-GT-EU-60D variant → both delivery types should be selectable
# 2. Select WOW-GT-EU-30D variant → only MANUAL should be enabled
# 3. Select WOW-GT-GLOBAL-90D variant → only AUTO_KEY should be enabled (automatically selected)
# 4. Try to publish with invalid delivery type → should be blocked by UI
# 5. Try to publish with valid delivery type → should succeed
```

### Database Verification

```bash
# Check variants have the new fields
cd packages/db
npx prisma studio

# Navigate to CatalogVariant table
# Verify: supportsAutoKey and supportsManual columns exist and have correct values
```

## Architecture Decisions

1. **Variant-Level Capabilities:** Delivery methods are determined per variant (not per product) because different variants of the same product may have different fulfillment options.

2. **UI Flow:** Variant selection before delivery type ensures sellers only see valid options, reducing errors and support tickets.

3. **Dual Validation:** Both frontend (UX) and backend (security) validate delivery capabilities, following defense-in-depth principles.

4. **MVP Flexibility:** For MVP, AUTO_KEY accepts either `keyPoolId` (preferred) or `stockCount`, allowing sellers to create offers while key pool management is being built.

5. **Progressive Enhancement:** Draft saves allow partial data, but publish enforces all rules, supporting iterative offer creation.

## Business Rules Enforced

✅ Variants define allowed delivery methods
✅ Invalid delivery type selections rejected with clear 400 errors
✅ UI auto-selects delivery type when only one option available
✅ Both supported → seller chooses
✅ Neither supported → variant should be inactive or filtered
✅ MANUAL requires `deliveryInstructions` (enforced on publish)
✅ AUTO_KEY requires `keyPoolId` or `stockCount` (enforced on publish)
✅ No DB writes on mere UI clicks; only on Save Draft/Publish

## Files Changed

### Schema & Migrations
- `packages/db/prisma/schema.prisma`

### Contracts (TypeScript Types)
- `packages/contracts/src/schemas/catalog.schema.ts`
- `packages/contracts/src/schemas/offer.schema.ts`

### Backend (NestJS)
- `apps/api/src/catalog/catalog.service.ts`
- `apps/api/src/offers/offers.service.ts`

### Frontend (Next.js)
- `apps/seller/app/products/new/page.tsx`

### Seed Data
- `packages/db/prisma/seed.ts`
- `packages/db/scripts/update-old-variants.ts` (new)

### Documentation
- `DELIVERY_CAPABILITIES_IMPLEMENTATION.md` (this file)

## Next Steps (Future Enhancements)

1. **Key Pool Management:** Implement full key pool system for AUTO_KEY delivery
2. **Variant Management UI:** Admin interface to set delivery capabilities per variant
3. **Reporting:** Analytics on delivery type preferences and success rates
4. **Advanced Rules:** Time-based delivery availability, region-specific restrictions
5. **Migration:** Create proper Prisma migration file (currently using `db push`)

## Known Issues

- Backend dev server must be manually restarted after Prisma schema changes
- Old variants were updated with a one-off script (not a migration)
- Consider adding a proper migration file for production deployments

---

**Implementation Date:** February 2, 2026  
**Status:** ✅ Complete and Ready for Testing
