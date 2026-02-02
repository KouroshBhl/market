# Product Wizard - Quick Start Guide

## What Was Done

✅ **Refactored product creation flow** from "click delivery type → create DB record" to a clean 5-step wizard  
✅ **NO database writes** until user clicks "Save Draft" or "Publish"  
✅ **Proper status lifecycle**: `draft` → `active` ↔ `inactive`  
✅ **Complete Swagger documentation** for all endpoints  
✅ **Separate delivery config tables** for AUTO_KEY and MANUAL products  
✅ **Full validation** on publish with clear error messages

---

## Files Changed

**Database:**
- `packages/db/prisma/schema.prisma` - Updated Product model + added delivery config tables

**Contracts:**
- `packages/contracts/src/schemas/product.schema.ts` - Updated types
- `packages/contracts/src/schemas/product-draft.schema.ts` - New draft/publish schemas
- `packages/contracts/src/index.ts` - Export new schemas

**API:**
- `apps/api/src/products/products.service.ts` - Complete rewrite with new business logic
- `apps/api/src/products/products.controller.ts` - 6 endpoints with Swagger docs

**Frontend:**
- `apps/seller/app/products/new/page.tsx` - Complete rewrite as 5-step wizard
- `apps/seller/app/products/products.columns.tsx` - Fixed to use new field names
- `apps/seller/lib/api.ts` - Updated API functions

**Documentation:**
- `MIGRATION_INSTRUCTIONS.md` - How to apply database changes
- `PRODUCT_WIZARD_VERIFICATION.md` - Comprehensive test checklist
- `PRODUCT_WIZARD_IMPLEMENTATION.md` - Technical details
- `QUICKSTART_PRODUCT_WIZARD.md` - This file

---

## Next Steps (You Need To Do This)

### 1. Apply Database Migration

```bash
cd packages/db

# Option A: Fresh database (development only)
pnpm prisma migrate reset
pnpm prisma db push
pnpm prisma generate

# Option B: With existing data (see MIGRATION_INSTRUCTIONS.md)
pnpm prisma migrate dev --name product_wizard_refactor
pnpm prisma generate
```

### 2. Rebuild Packages

```bash
# From project root
pnpm install
```

### 3. Start Servers

```bash
# Terminal 1: API
pnpm dev:api

# Terminal 2: Seller Dashboard  
pnpm dev:seller
```

### 4. Verify Everything Works

**Quick Check:**

1. Open http://localhost:4000/docs - Swagger UI should load
2. Open http://localhost:4000/api/openapi.json - Should return JSON
3. Open http://localhost:3001/products/new - Wizard should load
4. Create a product through the wizard - Should NOT create DB record until you save

**Full Verification:**

Follow the comprehensive checklist in `PRODUCT_WIZARD_VERIFICATION.md`

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products` | List all products |
| GET | `/products/:id` | Get single product |
| POST | `/products/draft` | Save new draft |
| PATCH | `/products/:id/draft` | Update draft |
| POST | `/products/:id/publish` | Publish draft |
| PATCH | `/products/:id/status` | Toggle active/inactive |

---

## Wizard Flow

```
1. Delivery Type Selection
   ↓ (NO API CALL)
2. Category Selection (Parent → Child)
   ↓ (NO API CALL)
3. Basic Information (Title, Price, etc.)
   ↓ (NO API CALL)
4. Delivery Configuration
   ↓ (NO API CALL)
5. Review & Actions
   ↓
   [Save Draft] → POST /products/draft → Redirect to /products
   OR
   [Publish] → POST /products/draft → POST /products/:id/publish → Redirect to /products
```

---

## Quick Tests

### Test 1: Wizard Does NOT Create Record Early

1. Go to http://localhost:3001/products/new
2. Open browser DevTools → Network tab
3. Click "Automatic Key Delivery"
4. **Verify:** NO API call is made
5. Click Next, select a category
6. **Verify:** NO API call is made
7. Fill in title, price
8. **Verify:** NO API call is made
9. Click through to Review
10. **Verify:** STILL no API call
11. Click "Save Draft"
12. **Verify:** NOW you see POST /products/draft

✅ **PASS if no API calls until step 11**

### Test 2: Publish Validates Required Fields

```bash
# Create draft with only deliveryType
curl -X POST http://localhost:4000/products/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "AUTO_KEY"
  }'

# Save the returned ID, then try to publish
curl -X POST http://localhost:4000/products/PRODUCT_ID/publish \
  -H "Content-Type: application/json"
```

**Expected:** 400 error with list of missing fields

### Test 3: Status Lifecycle Works

```bash
# Create and publish a product first (via wizard or API)
# Then test status transitions:

# Active → Inactive (should work)
curl -X PATCH http://localhost:4000/products/PRODUCT_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'

# Inactive → Active (should work)
curl -X PATCH http://localhost:4000/products/PRODUCT_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'

# Active → Draft (should FAIL - not in enum)
curl -X PATCH http://localhost:4000/products/PRODUCT_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "draft"}'
```

---

## Common Issues & Solutions

### Issue: "Property 'autoKeyConfig' does not exist"

**Cause:** Prisma client not regenerated after schema changes

**Solution:**
```bash
cd packages/db
pnpm prisma generate
```

### Issue: API won't start after migration

**Cause:** Old Prisma client cached

**Solution:**
```bash
# Clean and rebuild
cd packages/db
rm -rf node_modules/.prisma
pnpm prisma generate
cd ../..
pnpm install
```

### Issue: Swagger UI shows old endpoints

**Cause:** NestJS hasn't reloaded

**Solution:**
- Restart API server (Ctrl+C and `pnpm dev:api` again)
- Clear browser cache and refresh http://localhost:4000/docs

### Issue: Categories not loading in wizard

**Cause:** No category data in database

**Solution:**
```bash
# Add seed data (if you have a seed script)
cd packages/db
pnpm prisma db seed

# OR manually add via Prisma Studio
pnpm prisma studio
```

### Issue: "sellerId not found" error

**Cause:** Hardcoded sellerId doesn't exist in database

**Solution:**
- The wizard uses hardcoded sellerId: `00000000-0000-0000-0000-000000000001`
- This is a placeholder until authentication is implemented
- Products will be created with this sellerId regardless

---

## What to Test

### Critical Path (Must Work)
- [ ] Wizard shows all 5 steps
- [ ] NO API call on delivery type/category/basic info steps
- [ ] Save Draft creates a product with status="draft"
- [ ] Publish validates all required fields
- [ ] Published products have status="active" and publishedAt set
- [ ] Cannot publish already-published products
- [ ] Cannot update non-draft products via draft endpoint

### Nice to Have (Should Work)
- [ ] Progress indicator shows current step
- [ ] Back/Next buttons work correctly
- [ ] Validation prevents proceeding with incomplete data
- [ ] Error messages display clearly
- [ ] Swagger UI shows all 6 endpoints
- [ ] Swagger "Try it out" works
- [ ] Status toggle (active ↔ inactive) works

### Edge Cases (Good to Test)
- [ ] Cancel wizard (no DB record)
- [ ] Invalid category (parent instead of child) rejected
- [ ] Negative price rejected
- [ ] Wrong delivery config type rejected
- [ ] Publish without required fields shows clear errors

---

## Success Criteria

✅ **Wizard flow complete** - User can create product through all steps  
✅ **No premature DB writes** - Record only created on Save Draft/Publish  
✅ **Swagger docs visible** - http://localhost:4000/docs shows all endpoints  
✅ **OpenAPI JSON available** - http://localhost:4000/api/openapi.json returns spec  
✅ **Status lifecycle enforced** - draft → active/inactive, no going back  
✅ **Validation works** - Publish rejects incomplete products  

---

## Need Help?

- **Database migration issues:** See `MIGRATION_INSTRUCTIONS.md`
- **Full test checklist:** See `PRODUCT_WIZARD_VERIFICATION.md`
- **Technical details:** See `PRODUCT_WIZARD_IMPLEMENTATION.md`
- **OpenAPI dual system:** See `OPENAPI_DUAL_SYSTEM_NOTE.md`

---

## Summary

This refactor delivers exactly what was requested:
- ✅ Clean wizard flow (5 steps)
- ✅ No DB writes until Save/Publish
- ✅ Proper status lifecycle
- ✅ Category validation (child only)
- ✅ Delivery config per type
- ✅ Complete Swagger docs
- ✅ Scalable architecture

**Ready to go!** Just apply the migration and start testing.

---

**Last Updated:** 2026-02-01  
**Status:** ✅ Implementation Complete - Ready for Migration
