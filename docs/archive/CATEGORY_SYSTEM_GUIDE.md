# Category System Implementation Guide

## Overview

A 2-level category system for the marketplace seller dashboard that allows sellers to categorize their products during creation. The system enforces strict business rules and security policies.

## Business Rules

1. **Two-Level Hierarchy ONLY**: Parent → Child (no deeper nesting)
2. **Products Reference Child Categories**: Products must link to child categories, never parents
3. **Read-Only for Sellers**: Sellers can only view and select categories (no create/edit/delete)
4. **Active Categories Only**: Only active categories are selectable in seller UI
5. **Unique Slugs Per Level**: Sibling categories must have unique slugs

## Architecture

### Database Layer

**Location**: `/packages/db/`

- **Prisma Schema**: `prisma/schema.prisma`
  - `Category` model with self-referencing parent-child relationship
  - Foreign key from `Product.categoryId` → `Category.id`
  
- **SQL Migration**: `supabase/001_categories.sql`
  - Table creation with constraints
  - Indexes for performance
  - RLS policies for security
  - Validation triggers
  - Database-level 2-level depth enforcement

- **Seed Data**: `seed-categories.sql`
  - Initial category hierarchy
  - 5 parent categories with 4-5 children each

### Contract Layer

**Location**: `/packages/contracts/src/schemas/`

- **category.schema.ts**: Zod schemas for category data
  - `CategorySchema`: Base category
  - `ParentCategorySchema`: Parent with nested children
  - `ChildCategorySchema`: Child category
  - `CategoriesResponseSchema`: API response format

- **product-draft.schema.ts**: Updated with category support
  - `UpdateProductDraftSchema`: Includes optional `categoryId`
  - `ProductDraftSchema`: Includes nullable `categoryId`

### API Layer

**Location**: `/apps/api/src/`

- **categories/** (new module)
  - `categories.module.ts`: Module definition
  - `categories.controller.ts`: GET /categories endpoint
  - `categories.service.ts`: 
    - `getActiveCategories()`: Fetch parent categories with children
    - `validateChildCategory()`: Ensure categoryId is a valid child

- **products/** (updated)
  - `products.service.ts`: 
    - Added category validation in `updateDraft()`
    - Category service injection
  - `products.controller.ts`:
    - GET `/products/draft/:id`: Fetch draft
    - PATCH `/products/draft/:id`: Update draft (including category)

### Frontend Layer

**Location**: `/apps/seller/`

- **components/category-selector.tsx** (new)
  - Two-step selection UI
  - Parent category tabs/cards
  - Child category selection with search
  - Visual feedback for selected state

- **app/products/[id]/next-step/page.tsx** (updated)
  - Renamed to "Select Category" step
  - Fetches categories and draft data
  - Uses CategorySelector component
  - Saves category selection via PATCH API

## Database Setup

### 1. Generate Prisma Client

```bash
cd packages/db
pnpm prisma generate
```

### 2. Run Migration (Supabase)

Connect to your Supabase database and run:

```bash
# Using psql or Supabase SQL editor
psql <your-database-url> -f packages/db/supabase/001_categories.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of `packages/db/supabase/001_categories.sql`
3. Execute

### 3. Seed Categories

```bash
# Using psql or Supabase SQL editor
psql <your-database-url> -f packages/db/seed-categories.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of `packages/db/seed-categories.sql`
3. Execute

### 4. Verify Setup

```sql
-- Check parent categories
SELECT * FROM categories WHERE parent_id IS NULL ORDER BY sort_order;

-- Check all categories with hierarchy
SELECT
  p.name AS parent_category,
  c.name AS child_category,
  c.slug,
  c.is_active
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
ORDER BY p.sort_order NULLS FIRST, c.sort_order;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'categories';
```

## Database Constraints & Validation

### Enforced at Database Level

1. **2-Level Max Depth**: Trigger prevents categories with depth > 2
2. **Unique Slugs Per Level**: Composite unique constraint on (slug, parent_id)
3. **Products Must Use Child Categories**: Trigger validates product.category_id
4. **Cascade Deletion**: Deleting a parent deletes its children
5. **Updated_at Timestamp**: Auto-updated on row changes

### Enforced at Application Level

1. **Active Categories Only**: API filters by `isActive = true`
2. **Child Category Validation**: CategoriesService validates before saving
3. **Schema Validation**: Zod schemas validate all API inputs/outputs

## RLS Policies (Supabase)

### Sellers (authenticated users)
```sql
-- SELECT only, active categories only
CREATE POLICY "Sellers can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);
```

### Admin Users
```sql
-- Full CRUD access (for future admin UI)
CREATE POLICY "Admin users can manage all categories"
  ON categories FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

### Service Role
- Bypasses RLS by default
- Used for backend operations

## API Endpoints

### Get Active Categories

```http
GET /categories
Response: 200 OK
{
  "parents": [
    {
      "id": "uuid",
      "name": "Gaming",
      "slug": "gaming",
      "sortOrder": 10,
      "children": [
        {
          "id": "uuid",
          "name": "PC Games",
          "slug": "pc-games",
          "sortOrder": 10
        }
      ]
    }
  ]
}
```

### Get Product Draft

```http
GET /products/draft/:id
Response: 200 OK
{
  "id": "uuid",
  "status": "DRAFT",
  "deliveryType": "AUTO_KEY",
  "categoryId": "uuid" | null,
  "title": null,
  "description": null,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Update Product Draft

```http
PATCH /products/draft/:id
Body: {
  "categoryId": "uuid"
}
Response: 200 OK
{
  "id": "uuid",
  "status": "DRAFT",
  "deliveryType": "AUTO_KEY",
  "categoryId": "uuid",
  ...
}

# Error: Invalid category (parent or inactive)
Response: 400 Bad Request
{
  "statusCode": 400,
  "message": "Invalid category. Products must reference an active child category."
}
```

## Product Creation Flow

### Current Step-by-Step Flow

1. **Step 1**: Select Delivery Type → Creates draft
   - Route: `/products/new`
   - API: `POST /products/draft`

2. **Step 2**: Select Category → Updates draft ✨ NEW
   - Route: `/products/[id]/next-step`
   - API: `PATCH /products/draft/:id`

3. **Step 3**: [Future] Product details (title, description, price, etc.)

## UI Components

### CategorySelector

**Props**:
- `categories: ParentCategory[]` - List of parent categories with children
- `selectedCategoryId?: string | null` - Currently selected child category ID
- `onSelect: (categoryId: string) => void` - Callback when child is selected
- `disabled?: boolean` - Disable all interactions

**Features**:
- Visual parent category cards with child count
- Auto-select parent if category is pre-selected
- Search filter for child categories (when > 5 children)
- Clear visual feedback for selected states
- Responsive grid layout
- Accessible keyboard navigation

## Testing

### Manual Testing Checklist

1. **Database Setup**
   - [ ] Migration runs without errors
   - [ ] Seed data creates 5 parents + multiple children
   - [ ] RLS policies are active
   - [ ] Validation triggers work (try inserting invalid data)

2. **API Endpoints**
   - [ ] GET /categories returns active categories with children
   - [ ] GET /products/draft/:id returns draft with categoryId
   - [ ] PATCH /products/draft/:id accepts valid child categoryId
   - [ ] PATCH /products/draft/:id rejects parent categoryId (400 error)
   - [ ] PATCH /products/draft/:id rejects inactive categoryId (400 error)

3. **Seller UI Flow**
   - [ ] Create new product → Draft created
   - [ ] Category selection page loads with parent categories
   - [ ] Click parent → Child categories appear
   - [ ] Search filters child categories (if > 5 children)
   - [ ] Select child → "Selected" badge appears
   - [ ] Click Continue → Category saved to draft
   - [ ] Return to page → Previously selected category is highlighted

4. **Validation**
   - [ ] Cannot continue without selecting a child category
   - [ ] Cannot select parent category as product category
   - [ ] Error messages display clearly
   - [ ] Loading states work correctly

### Database Validation Tests

```sql
-- TEST 1: Try to create 3-level deep category (should fail)
INSERT INTO categories (name, slug, parent_id)
VALUES ('Grandchild', 'grandchild', '20000000-0000-0000-0000-000000000001');
-- Expected: ERROR - Categories cannot be nested more than 2 levels deep

-- TEST 2: Try to assign parent category to product (should fail)
UPDATE "Product" 
SET category_id = '10000000-0000-0000-0000-000000000001' 
WHERE id = '<some-product-id>';
-- Expected: ERROR - Products must reference an active child category

-- TEST 3: Try to create duplicate slug at same level (should fail)
INSERT INTO categories (name, slug, parent_id)
VALUES ('Duplicate', 'pc-games', '10000000-0000-0000-0000-000000000001');
-- Expected: ERROR - Unique constraint violation
```

## Folder Structure Summary

```
/Users/kouroshbaharloo/projects/market/
│
├── packages/
│   ├── db/
│   │   ├── prisma/
│   │   │   └── schema.prisma          # Category + Product models
│   │   ├── supabase/
│   │   │   └── 001_categories.sql     # Migration + RLS + Triggers
│   │   └── seed-categories.sql         # Initial category data
│   │
│   └── contracts/
│       └── src/schemas/
│           ├── category.schema.ts      # Category Zod schemas
│           └── product-draft.schema.ts # Updated with categoryId
│
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── categories/             # NEW MODULE
│   │       │   ├── categories.module.ts
│   │       │   ├── categories.controller.ts
│   │       │   └── categories.service.ts
│   │       ├── products/
│   │       │   ├── products.module.ts  # Imports CategoriesModule
│   │       │   ├── products.controller.ts  # Added GET/PATCH draft endpoints
│   │       │   └── products.service.ts     # Added category validation
│   │       └── app.module.ts           # Imports CategoriesModule
│   │
│   └── seller/
│       ├── components/
│       │   └── category-selector.tsx   # NEW COMPONENT
│       └── app/products/
│           └── [id]/next-step/
│               └── page.tsx            # Category selection page
│
└── CATEGORY_SYSTEM_GUIDE.md           # This file
```

## Commands Reference

```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd packages/db && pnpm prisma generate

# Run API server
cd apps/api && pnpm dev

# Run Seller dashboard
cd apps/seller && pnpm dev

# Run migrations (via psql)
psql <database-url> -f packages/db/supabase/001_categories.sql

# Seed categories (via psql)
psql <database-url> -f packages/db/seed-categories.sql
```

## Future Enhancements

1. **Admin UI**: Category management CRUD interface (not in this phase)
2. **Category Images**: Add icon/image support for categories
3. **Translations**: Multi-language category names
4. **Category Attributes**: Define category-specific product attributes
5. **Analytics**: Track popular categories
6. **Category Tags**: Additional metadata for filtering

## Security Notes

- Sellers can ONLY read active categories (enforced by RLS)
- Category validation happens at both DB and API layers
- Service role bypasses RLS for admin operations
- All API inputs validated with Zod schemas
- SQL injection protected by Prisma ORM

## Troubleshooting

### Categories not showing in UI
1. Check API is running: `curl http://localhost:4000/categories`
2. Check Prisma client is generated: `pnpm prisma generate`
3. Check categories are seeded: `SELECT COUNT(*) FROM categories;`
4. Check RLS policies allow SELECT: Run as seller user

### Cannot save category
1. Check categoryId is a child (not parent): Query `SELECT parent_id FROM categories WHERE id = '<categoryId>';`
2. Check category is active: Query `SELECT is_active FROM categories WHERE id = '<categoryId>';`
3. Check API validation error message for details

### Migration fails
1. Check Postgres version (needs 12+)
2. Check database connection
3. Run migrations in order (001_categories.sql first)
4. Check existing schema conflicts

## Support

For questions or issues, refer to:
- Prisma docs: https://www.prisma.io/docs
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- NestJS modules: https://docs.nestjs.com/modules
