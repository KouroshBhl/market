# Category System - Prisma Implementation

## Overview

A clean 2-level category system (parent → child) implemented using **Prisma only**. No Supabase, no SQL migrations, just Prisma schema + seeding.

## Architecture

### Schema Design

```prisma
model Category {
  id        String     @id @default(uuid())
  parentId  String?    @map("parent_id")
  name      String
  slug      String
  isActive  Boolean    @default(true) @map("is_active")
  sortOrder Int        @default(0) @map("sort_order")
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  // Self-reference for parent-child relationship
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children Category[] @relation("CategoryHierarchy")
  products Product[]

  // Constraints
  @@unique([slug, parentId], name: "unique_slug_per_level")
  @@index([parentId])
  @@index([isActive])
  @@index([sortOrder])
  @@index([isActive, parentId])
  @@map("categories")
}
```

**Key Features:**
- ✅ Self-referencing relation for hierarchy
- ✅ Unique slugs per level (siblings can't have same slug)
- ✅ Cascade deletion (delete parent → children deleted)
- ✅ Optimized indexes for queries
- ✅ Snake_case DB columns, camelCase Prisma fields

### Business Rules

1. **2-Level Maximum**: Parent → Child (no grandchildren)
2. **Products Reference Children Only**: Products link to child categories, never parents
3. **Active Flag**: Only `isActive = true` categories shown to sellers
4. **Sort Order**: Categories display in `sortOrder` ascending
5. **Unique Slugs Per Level**: Siblings must have unique slugs

### Depth Validation

Since Prisma can't enforce depth via schema, we use **application-level validation**:

```typescript
// packages/db/src/category-helpers.ts
export async function validateMaxDepth(parentId: string | null): Promise<void> {
  if (!parentId) return; // Root level OK

  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { parentId: true, name: true },
  });

  if (parent?.parentId) {
    throw new Error(`Cannot nest categories more than 2 levels deep`);
  }
}
```

Call this before creating a category with a parent.

---

## Setup & Usage

### 1. Initial Setup

```bash
cd packages/db

# Generate Prisma Client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push

# Seed initial categories
pnpm db:seed
```

### 2. Available Scripts

In `packages/db/package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 3. Seeded Categories

**Parents (4):**
- Games
- Gift Cards
- Software
- Services

**Children (20):**
- Games: World of Warcraft, League of Legends, Counter-Strike 2, Valorant, Fortnite
- Gift Cards: Steam, PlayStation, Xbox, Apple, Google Play, Netflix
- Software: Windows, Microsoft Office, Adobe Creative Cloud, Antivirus Software
- Services: Game Coaching, Account Leveling, Rank Boosting, Custom Artwork

---

## API Usage

### Fetch Active Categories

```typescript
// apps/api/src/categories/categories.service.ts
import { getActiveCategoriesWithChildren } from '@workspace/db/src/category-helpers';

async getActiveCategories() {
  const parents = await getActiveCategoriesWithChildren();
  return { parents };
}
```

**Response Shape:**
```typescript
{
  parents: [
    {
      id: "uuid",
      name: "Games",
      slug: "games",
      sortOrder: 10,
      children: [
        { id: "uuid", name: "World of Warcraft", slug: "world-of-warcraft", sortOrder: 10 },
        { id: "uuid", name: "League of Legends", slug: "league-of-legends", sortOrder: 20 },
        // ...
      ]
    },
    // ...
  ]
}
```

### Validate Child Category

```typescript
import { validateChildCategory } from '@workspace/db/src/category-helpers';

async updateProduct(productId: string, categoryId: string) {
  const isValid = await validateChildCategory(categoryId);
  
  if (!isValid) {
    throw new BadRequestException(
      'Products must reference an active child category (not a parent)'
    );
  }
  
  // Proceed with update...
}
```

---

## Helper Functions

Located in `packages/db/src/category-helpers.ts`:

### `getActiveCategoriesWithChildren()`
Fetches all active parent categories with their active children, ordered by `sortOrder`.

**Use Case:** Two-step category selector in seller UI.

### `validateChildCategory(categoryId: string)`
Returns `true` if category exists, is active, and has a parent (is a child).

**Use Case:** Product create/update validation.

### `validateMaxDepth(parentId: string | null)`
Throws error if parentId already has a parent (would create 3-level nesting).

**Use Case:** Category creation (admin UI, future).

---

## Database Operations

### View Categories in Prisma Studio

```bash
cd packages/db
pnpm db:studio
```

Opens GUI at `http://localhost:5555`

### Query Examples

```typescript
// Get all parent categories
const parents = await prisma.category.findMany({
  where: { parentId: null, isActive: true },
  orderBy: { sortOrder: 'asc' },
});

// Get children of a specific parent
const children = await prisma.category.findMany({
  where: {
    parentId: 'parent-uuid-here',
    isActive: true,
  },
  orderBy: { sortOrder: 'asc' },
});

// Count categories by level
const counts = await prisma.$queryRaw`
  SELECT 
    CASE WHEN parent_id IS NULL THEN 'Parent' ELSE 'Child' END as level,
    COUNT(*) as count
  FROM categories
  WHERE is_active = true
  GROUP BY level
`;
```

---

## Migration Workflow

### Development (Schema Changes)

```bash
# 1. Edit schema.prisma
# 2. Push to dev database
pnpm db:push

# 3. Re-seed if needed
pnpm db:seed
```

### Production (Proper Migrations)

```bash
# Create migration
pnpm db:migrate

# Apply in production
pnpm prisma migrate deploy
```

---

## UI Integration

### Two-Step Selector Flow

1. **Display parent categories** (Games, Gift Cards, Software, Services)
2. **User selects parent** → Filter children
3. **Display child categories** for selected parent
4. **User selects child** → Save to product

### Component Example

```typescript
// apps/seller/components/category-selector.tsx
interface Props {
  categories: ParentCategoryWithChildren[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
}

function CategorySelector({ categories, selectedCategoryId, onSelect }: Props) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  
  const activeChildren = categories
    .find(p => p.id === selectedParentId)
    ?.children || [];
  
  return (
    <>
      {/* Parent tabs/cards */}
      {categories.map(parent => (
        <ParentCard 
          key={parent.id}
          parent={parent}
          isActive={selectedParentId === parent.id}
          onClick={() => setSelectedParentId(parent.id)}
        />
      ))}
      
      {/* Child list */}
      {activeChildren.map(child => (
        <ChildCard
          key={child.id}
          child={child}
          isSelected={selectedCategoryId === child.id}
          onClick={() => onSelect(child.id)}
        />
      ))}
    </>
  );
}
```

---

## Troubleshooting

### "Category depth limit exceeded"

**Cause:** Attempting to create a category with a parent that already has a parent.

**Fix:** Ensure you're only creating 2-level hierarchies (parent → child).

### "Unique constraint failed on slug, parentId"

**Cause:** Two sibling categories have the same slug.

**Fix:** Ensure slugs are unique among siblings. Same slug OK at different levels.

### Products not showing category

**Cause:** Product references parent category instead of child.

**Fix:** Always validate with `validateChildCategory()` before saving.

---

## Files Structure

```
packages/db/
├── prisma/
│   ├── schema.prisma          # Category model definition
│   └── seed.ts                # Seeding script (4 parents, 20 children)
├── src/
│   ├── index.ts               # Prisma client export
│   └── category-helpers.ts    # Helper functions
└── package.json               # Scripts: db:seed, db:push, etc.

apps/api/src/categories/
├── categories.module.ts
├── categories.controller.ts   # GET /categories
└── categories.service.ts      # Uses category-helpers
```

---

## What Was Removed

✅ **Deleted Supabase artifacts:**
- `packages/db/supabase/001_categories.sql`
- `packages/db/supabase/` (entire folder)
- `packages/db/seed-categories.sql`
- `packages/db/seed-categories.ts` (replaced by prisma/seed.ts)
- `scripts/setup-categories.sh`
- `scripts/verify-categories.sql`

✅ **Consolidated into:**
- Single source of truth: `prisma/schema.prisma`
- Single seeding approach: `prisma/seed.ts`
- Helper functions: `src/category-helpers.ts`

---

## Summary

| Aspect | Implementation |
|--------|---------------|
| **Schema** | Prisma self-referencing relation |
| **Depth Limit** | Application-level validation |
| **Seeding** | `prisma/seed.ts` with `tsx` |
| **Queries** | Helper functions in `@workspace/db` |
| **Validation** | `validateChildCategory()` |
| **UI** | Two-step selector (parent → child) |
| **Migration** | `prisma migrate dev` or `prisma db push` |

**No Supabase. No SQL files. Pure Prisma.**
