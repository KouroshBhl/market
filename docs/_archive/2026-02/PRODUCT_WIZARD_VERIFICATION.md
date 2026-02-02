# Product Wizard Refactor - Verification Checklist

## Overview
This document provides step-by-step verification for the product wizard refactor.

## Prerequisites

1. **Apply Database Migration**:
```bash
cd packages/db
pnpm prisma migrate dev --name product_wizard_refactor
pnpm prisma generate
```

2. **Start Development Servers**:
```bash
# Terminal 1: API Server
pnpm dev:api

# Terminal 2: Seller Dashboard
pnpm dev:seller
```

---

## A) Database Verification

### 1. Verify Schema Structure

```bash
cd packages/db
pnpm prisma studio
```

**Check:**
- [ ] `products` table has `seller_id`, `status` (enum), `price_amount`, `currency`, `published_at`
- [ ] `product_auto_key_configs` table exists with `product_id`, `key_pool_id`, `auto_delivery`, `stock_alert`
- [ ] `product_manual_delivery_configs` table exists with `product_id`, `delivery_instructions`, `estimated_delivery_sla`
- [ ] ProductStatus enum exists with values: `draft`, `active`, `inactive`

### 2. Verify Indexes

```sql
-- Run in your database client
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('products', 'product_auto_key_configs', 'product_manual_delivery_configs')
ORDER BY tablename, indexname;
```

**Check:**
- [ ] Index on `products(seller_id, status)`
- [ ] Index on `products(status, published_at)`
- [ ] Index on `products(category_id)`

---

## B) API Endpoint Verification

### 1. Categories Endpoint

```bash
curl http://localhost:4000/categories | jq
```

**Expected:**
- [ ] Returns JSON with `parents` array
- [ ] Each parent has `id`, `name`, `slug`, `sortOrder`, `children` array
- [ ] Children are nested correctly

### 2. OpenAPI JSON

```bash
curl http://localhost:4000/api/openapi.json | jq '.paths'
```

**Expected:**
- [ ] Contains `/categories` endpoint
- [ ] Contains `/products` endpoint
- [ ] Contains `/products/draft` endpoint
- [ ] Contains `/products/{id}/draft` endpoint
- [ ] Contains `/products/{id}/publish` endpoint
- [ ] Contains `/products/{id}/status` endpoint

### 3. Swagger UI

Open browser: http://localhost:4000/docs

**Check:**
- [ ] Swagger UI loads successfully
- [ ] "Products" tag shows 6 endpoints:
  - GET /products
  - GET /products/{id}
  - POST /products/draft
  - PATCH /products/{id}/draft
  - POST /products/{id}/publish
  - PATCH /products/{id}/status
- [ ] "Categories" tag shows:
  - GET /categories
- [ ] Each endpoint shows request/response schemas
- [ ] Can expand and view example payloads

---

## C) API Functionality Tests

### 1. Create Product Draft (Minimal)

```bash
curl -X POST http://localhost:4000/products/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "AUTO_KEY"
  }' | jq
```

**Expected:**
- [ ] Returns 201 status
- [ ] Response includes `id`, `status: "draft"`, `deliveryType: "AUTO_KEY"`
- [ ] All other fields are `null`
- [ ] **NO database record created until this API call**

Save the returned `id` for next tests:
```bash
PRODUCT_ID="paste-id-here"
```

### 2. Update Draft with Category

```bash
curl -X PATCH http://localhost:4000/products/$PRODUCT_ID/draft \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "10000000-0000-0000-0000-000000000001",
    "title": "Test Product",
    "description": "Test description",
    "priceAmount": 1999,
    "currency": "USD"
  }' | jq
```

**Expected:**
- [ ] Returns 200 status
- [ ] Response includes updated fields
- [ ] `status` is still `"draft"`

### 3. Update Draft with Delivery Config

```bash
curl -X PATCH http://localhost:4000/products/$PRODUCT_ID/draft \
  -H "Content-Type: application/json" \
  -d '{
    "autoKeyConfig": {
      "autoDelivery": true,
      "stockAlert": 10,
      "keyPoolId": null
    }
  }' | jq
```

**Expected:**
- [ ] Returns 200 status
- [ ] Response includes `autoKeyConfig` object

### 4. Publish Draft

```bash
curl -X POST http://localhost:4000/products/$PRODUCT_ID/publish \
  -H "Content-Type: application/json" | jq
```

**Expected:**
- [ ] Returns 200 status
- [ ] `status` is now `"active"`
- [ ] `publishedAt` is set (ISO datetime string)

### 5. Toggle Status to Inactive

```bash
curl -X PATCH http://localhost:4000/products/$PRODUCT_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }' | jq
```

**Expected:**
- [ ] Returns 200 status
- [ ] `status` is now `"inactive"`

### 6. Toggle Status Back to Active

```bash
curl -X PATCH http://localhost:4000/products/$PRODUCT_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }' | jq
```

**Expected:**
- [ ] Returns 200 status
- [ ] `status` is now `"active"`

### 7. Try to Publish Already Published Product

```bash
curl -X POST http://localhost:4000/products/$PRODUCT_ID/publish \
  -H "Content-Type: application/json" | jq
```

**Expected:**
- [ ] Returns 400 status
- [ ] Error message: "Only draft products can be published"

### 8. Try to Update Draft (Should Fail - Not a Draft)

```bash
curl -X PATCH http://localhost:4000/products/$PRODUCT_ID/draft \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Should fail"
  }' | jq
```

**Expected:**
- [ ] Returns 400 status
- [ ] Error message: "Only draft products can be updated via this endpoint"

---

## D) Frontend Wizard Tests

Open browser: http://localhost:3001/products/new

### Step 1: Delivery Type Selection

**Check:**
- [ ] Page loads without errors
- [ ] Two delivery type cards are displayed
- [ ] Cards are clickable and show selection state
- [ ] "Next: Select Category" button is disabled initially
- [ ] Selecting a delivery type enables the Next button
- [ ] **Network tab shows NO API calls when selecting delivery type**

**Action:** Select "Automatic Key Delivery"

**Expected:**
- [ ] Card shows selected state (border highlight)
- [ ] No API call is made (check Network tab)
- [ ] Next button becomes enabled

Click "Next: Select Category"

### Step 2: Category Selection

**Check:**
- [ ] Categories load and display
- [ ] Parent categories show as buttons/cards
- [ ] Clicking a parent shows its children
- [ ] Selecting a child category works
- [ ] Search input appears if parent has many children
- [ ] "Next: Basic Information" button is disabled until category selected

**Action:** Select a parent category, then select a child category

**Expected:**
- [ ] Selected child shows "Selected" badge
- [ ] Next button becomes enabled

Click "Next: Basic Information"

### Step 3: Basic Information

**Check:**
- [ ] Title input field (required)
- [ ] Description textarea (optional)
- [ ] Price input (required, numeric)
- [ ] Currency dropdown (default: USD)
- [ ] Character counters display correctly
- [ ] "Next: Delivery Configuration" button disabled until title + price entered

**Action:** Fill in:
- Title: "Test Wizard Product"
- Description: "Testing the wizard flow"
- Price: "19.99"
- Currency: "USD"

**Expected:**
- [ ] Character counter updates
- [ ] Next button becomes enabled

Click "Next: Delivery Configuration"

### Step 4: Delivery Configuration

**For AUTO_KEY:**

**Check:**
- [ ] Shows "Automatic Key Delivery" badge
- [ ] "Enable automatic delivery" checkbox (checked by default)
- [ ] "Low Stock Alert" input (optional, numeric)

**Action:** 
- Keep auto delivery enabled
- Set stock alert to "10"

**Expected:**
- [ ] Fields accept input
- [ ] Next button is enabled (all fields optional)

Click "Next: Review"

### Step 5: Review

**Check:**
- [ ] All entered data is displayed correctly
- [ ] Delivery type badge shown
- [ ] Product details section shows title, description, price
- [ ] Delivery configuration section shows settings
- [ ] Two buttons: "Save as Draft" and "Publish Product"

### Step 6: Save as Draft

**Action:** Click "Save as Draft"

**Expected:**
- [ ] Shows loading state
- [ ] API call to POST /products/draft
- [ ] Redirects to /products page
- [ ] Product appears in products list with "draft" status

### Step 7: Publish Product

**Action:** Start wizard again, fill all steps, click "Publish Product" in review

**Expected:**
- [ ] Shows loading state
- [ ] API call to POST /products/draft followed by POST /products/{id}/publish
- [ ] Redirects to /products page
- [ ] Product appears with "active" status and `publishedAt` timestamp

---

## E) Error Handling Tests

### 1. Publish Without Required Fields

Create draft with only delivery type:

```bash
curl -X POST http://localhost:4000/products/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "MANUAL"
  }' | jq
```

Save the ID, then try to publish:

```bash
curl -X POST http://localhost:4000/products/NEW_DRAFT_ID/publish \
  -H "Content-Type: application/json" | jq
```

**Expected:**
- [ ] Returns 400 status
- [ ] Error message lists missing fields:
  - "Category is required"
  - "Title is required"
  - "Price is required"
  - "Currency is required"
  - "Manual delivery configuration is required"

### 2. Invalid Category (Parent Instead of Child)

Assuming "00000000-0000-0000-0000-000000000001" is a parent category:

```bash
curl -X POST http://localhost:4000/products/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "AUTO_KEY",
    "categoryId": "00000000-0000-0000-0000-000000000001",
    "title": "Test",
    "priceAmount": 1000,
    "currency": "USD"
  }' | jq
```

**Expected:**
- [ ] Returns 400 status
- [ ] Error message: "Invalid category. Products must reference an active child category"

### 3. Wrong Delivery Config Type

```bash
curl -X POST http://localhost:4000/products/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "AUTO_KEY",
    "manualDeliveryConfig": {
      "deliveryInstructions": "Should fail"
    }
  }' | jq
```

**Expected:**
- [ ] Returns 400 status
- [ ] Error message: "Cannot provide manual delivery config for AUTO_KEY products"

---

## F) Status Transition Tests

### Valid Transitions:
- [ ] draft → active (via publish)
- [ ] active → inactive (via status update)
- [ ] inactive → active (via status update)

### Invalid Transitions (should fail):
- [ ] active → draft ❌
- [ ] inactive → draft ❌
- [ ] draft → inactive ❌ (must publish first)

**Test invalid transition:**

```bash
# Create and publish a product first
# Then try to update its status to draft (should fail)

curl -X PATCH http://localhost:4000/products/$PRODUCT_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "draft"
  }' | jq
```

**Expected:**
- [ ] Returns 400 status (validation error from Zod schema - only "active" and "inactive" allowed)

---

## G) Key Business Rules Verification

- [ ] **NO database record created on delivery type selection** (only on Save Draft/Publish)
- [ ] **Category must be child category** (parent categories rejected)
- [ ] **Status lifecycle enforced** (draft → active/inactive, no going back to draft)
- [ ] **Publish validates all required fields** before setting status to active
- [ ] **Price stored as integer** (cents) to avoid floating point issues
- [ ] **Delivery config type matches delivery type** (auto key config only for AUTO_KEY, etc.)
- [ ] **Draft can be saved with partial data** (only sellerId + deliveryType required)
- [ ] **Published products cannot be edited via draft endpoints**

---

## H) Swagger Documentation Verification

Open: http://localhost:4000/docs

For each endpoint, verify:

1. **GET /categories**
   - [ ] Summary and description clear
   - [ ] Response schema shows parent/child structure
   - [ ] Example values present

2. **POST /products/draft**
   - [ ] All parameters documented
   - [ ] Required fields marked
   - [ ] Optional fields marked
   - [ ] Example request body shown
   - [ ] Response schema accurate

3. **PATCH /products/{id}/draft**
   - [ ] Path parameter documented
   - [ ] Request body schema shows optional fields
   - [ ] Error responses documented

4. **POST /products/{id}/publish**
   - [ ] Clear description of validation
   - [ ] Error response shows validation error format

5. **PATCH /products/{id}/status**
   - [ ] Status enum shows only "active" and "inactive"
   - [ ] Error cases documented

6. **Try "Try it out" feature**
   - [ ] Can execute requests from Swagger UI
   - [ ] Responses display correctly

---

## I) Code Quality Checks

- [ ] No hardcoded colors in frontend (only semantic tokens from @workspace/ui)
- [ ] All API responses use ISO date strings (not Date objects)
- [ ] Frontend uses @workspace/contracts types
- [ ] No direct Prisma types exposed to frontend
- [ ] All database writes are in transactions where needed
- [ ] Error handling includes user-friendly messages

---

## Summary

Once all checkboxes are complete, the product wizard refactor is verified and working correctly.

## Common Issues & Solutions

**Issue:** Prisma client out of sync
```bash
cd packages/db
pnpm prisma generate
```

**Issue:** Migration conflicts
```bash
cd packages/db
pnpm prisma migrate reset
pnpm prisma db push
```

**Issue:** API not showing Swagger UI
- Check that API is running on port 4000
- Navigate to http://localhost:4000/docs (not /api/docs)

**Issue:** Frontend can't connect to API
- Check NEXT_PUBLIC_API_URL in .env.local
- Should be http://localhost:4000 (no trailing slash)

**Issue:** Categories not loading
- Ensure database has category seed data
- Check Prisma Studio to verify categories exist
