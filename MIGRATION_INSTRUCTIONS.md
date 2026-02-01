# Product Wizard Refactor - Database Migration Instructions

## Overview
This migration refactors the product creation flow to support a wizard-based approach with proper status lifecycle management and delivery configurations.

## Changes

### Schema Updates
1. **Product Status Enum**: Changed from string to enum with values: `draft`, `active`, `inactive`
2. **Product Model Changes**:
   - Added: `sellerId` (String, required)
   - Changed: `status` to ProductStatus enum (default: `draft`)
   - Renamed: `basePrice` → `priceAmount`
   - Renamed: `baseCurrency` → `currency` (removed displayCurrency)
   - Added: `publishedAt` (DateTime, nullable)
   - Renamed: `deliveryType` column to use snake_case mapping
   - Added snake_case mappings for all columns

3. **New Models**:
   - `ProductAutoKeyConfig`: Configuration for AUTO_KEY delivery type
   - `ProductManualDeliveryConfig`: Configuration for MANUAL delivery type

4. **Indexes Added**:
   - `[sellerId, status]` for seller product queries
   - `[status, publishedAt]` for marketplace queries

## Migration Steps

### 1. Review Current Database State

```bash
cd packages/db
pnpm prisma db pull
```

### 2. Create Migration

```bash
cd packages/db
pnpm prisma migrate dev --name product_wizard_refactor
```

### 3. If Migration Fails (Data Exists)

If you have existing product data that needs migration:

```sql
-- 1. Add new columns (allow NULL temporarily)
ALTER TABLE products ADD COLUMN seller_id UUID;
ALTER TABLE products ADD COLUMN published_at TIMESTAMP;

-- 2. Backfill seller_id with a default value
-- Replace with actual seller UUID from your users table
UPDATE products SET seller_id = '00000000-0000-0000-0000-000000000001';

-- 3. Rename columns
ALTER TABLE products RENAME COLUMN base_price TO price_amount;
ALTER TABLE products RENAME COLUMN base_currency TO currency;
ALTER TABLE products DROP COLUMN IF EXISTS display_currency;

-- 4. Update status values
UPDATE products SET status = LOWER(status);
UPDATE products SET status = 'draft' WHERE status NOT IN ('draft', 'active', 'inactive');

-- 5. Set published_at for non-draft products
UPDATE products SET published_at = created_at WHERE status != 'draft';

-- 6. Make seller_id required
ALTER TABLE products ALTER COLUMN seller_id SET NOT NULL;

-- 7. Create new delivery config tables
-- (Prisma will handle this)
```

Then run:

```bash
pnpm prisma migrate dev --name product_wizard_refactor_with_data
```

### 4. Generate Prisma Client

```bash
cd packages/db
pnpm prisma generate
```

### 5. Restart API Server

```bash
# From project root
pnpm dev:api
```

## Fresh Database (Recommended for Development)

If you're in development and can reset the database:

```bash
cd packages/db
pnpm prisma migrate reset
pnpm prisma db push
pnpm prisma generate
```

This will:
1. Drop the database
2. Recreate it
3. Apply all migrations
4. Seed data (if seed script exists)

## Verification

After migration, verify:

1. **Schema is correct**:
```bash
cd packages/db
pnpm prisma studio
```

2. **API endpoints work**:
```bash
# Test categories endpoint
curl http://localhost:4000/categories

# Test OpenAPI JSON
curl http://localhost:4000/api/openapi.json

# Test Swagger UI
open http://localhost:4000/docs
```

3. **Frontend wizard works**:
```bash
# Start seller app
pnpm dev:seller

# Navigate to http://localhost:3001/products/new
```

## Rollback (if needed)

If you need to rollback:

```bash
cd packages/db
pnpm prisma migrate resolve --rolled-back MIGRATION_NAME
git checkout HEAD -- prisma/schema.prisma
pnpm prisma generate
```

## Post-Migration Tasks

1. Update any existing product seeds in `prisma/seed.ts`
2. Add sellerId when creating products (currently hardcoded as '00000000-0000-0000-0000-000000000001')
3. Implement seller authentication and use actual seller IDs

## Notes

- The `sellerId` field is currently not a foreign key to allow flexibility before user/seller models are finalized
- When adding user authentication, add the FK constraint: `@@relation(fields: [sellerId], references: [id])`
- All monetary amounts are stored as integers (cents) to avoid floating point issues
