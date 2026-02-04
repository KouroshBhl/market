# PRODUCT DOMAIN

Single source of truth for marketplace catalog, categories, product types, delivery capabilities, and the product wizard.

---

## Marketplace Model

### Architecture

```
Admin creates:    CatalogProduct → CatalogVariant(s)
Seller creates:   Offer (references CatalogVariant)
Buyer sees:       Product page with multiple seller Offers
```

### Why This Model

- **Consistency**: Unified product pages, no duplicate listings
- **Better UX**: Buyers compare offers for the same product
- **Easier search**: Structured catalog with known attributes
- **Quality control**: Admin curates what can be sold

---

## Data Models

### Category (2-level hierarchy ONLY)

```
Parent Category (parentId = null)
└── Child Category (parentId = parent.id)
    └── Products reference child categories ONLY
```

**Constraints**:

- Maximum 2 levels (parent → child)
- Products MUST reference child categories (never parents)
- Depth enforced at application level
- Unique slugs per level: `@@unique([slug, parentId])`

### CatalogProduct (Admin-managed)

```prisma
model CatalogProduct {
  id          String   @id @default(uuid())
  categoryId  String   // MUST be child category
  name        String
  slug        String   @unique
  description String?
  imageUrl    String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
}
```

### CatalogVariant

```prisma
model CatalogVariant {
  id              String   @id @default(uuid())
  productId       String
  region          Region   // EU | US | TR | GLOBAL
  durationDays    Int?
  edition         String?
  sku             String   @unique
  supportsAutoKey Boolean  @default(false)
  supportsManual  Boolean  @default(true)
  isActive        Boolean  @default(true)
}
```

### Offer (Seller-created)

```prisma
model Offer {
  id                   String      @id @default(uuid())
  sellerId             String
  variantId            String
  status               OfferStatus // draft | active | inactive
  deliveryType         DeliveryType // AUTO_KEY | MANUAL
  priceAmount          Int         // cents (never Float)
  currency             Currency
  stockCount           Int?
  deliveryInstructions String?     // for MANUAL
  keyPoolId            String?     // for AUTO_KEY
  publishedAt          DateTime?
}
```

---

## Delivery Types

### AUTO_KEY

- Automated key delivery from pool
- Requires `keyPoolId` on publish (or `stockCount` for MVP)
- Keys encrypted at rest (AES-256-GCM)
- Atomic fulfillment with row-level locking

### MANUAL

- Seller fulfills manually
- Requires `deliveryInstructions` on publish
- Optional estimated SLA

### Variant Capabilities

Each variant defines which delivery types it supports:

- `supportsAutoKey: true/false`
- `supportsManual: true/false`
- If variant only supports one type, auto-select it in wizard
- Validation: Reject offer if variant doesn't support chosen delivery type

---

## Offer Lifecycle

```
[draft] ──publish──> [active] <──toggle──> [inactive]
   │                    │                      │
   │                    └──────────────────────┘
   │                    (cannot revert to draft)
   │
   └── Can update freely until published
```

**Rules**:

- New offers start as `draft`
- Draft can be updated multiple times
- Publish validates all required fields, sets `publishedAt`
- Active/inactive can toggle
- **CANNOT** go back to draft once published

---

## Product Wizard Flow

### Steps (Catalog-Based Flow)

```
1. Category Selection      → Choose parent, then child
2. Product Selection       → Pick from catalog (filtered by category)
3. Variant Selection       → Choose region/duration/edition
4. Delivery Type           → AUTO_KEY or MANUAL (based on variant capabilities)
5. Pricing & Config        → Price, currency, delivery config
6. Review                  → Summary before save/publish
```

### State Management Rules

- **NO database writes** until "Save Draft" or "Publish"
- All wizard state in component state (no global store needed)
- Cancel = no DB impact
- User can navigate back and forth freely

### API Calls

```
Save Draft → POST /offers/draft (partial validation)
Publish    → POST /offers/publish (full validation)
```

---

## Category System

### Seeded Categories

```
Games (5 children)
├── PC Games, Console Games, Game Keys, In-Game Currency, Game Accounts

Software (5 children)
├── Operating Systems, Office Software, Security Software, Design Tools, Developer Tools

Gift Cards (4 children)
├── Gaming Gift Cards, Entertainment, Shopping, Streaming Services

Services (4 children)
├── Coaching, Consulting, Account Leveling, Custom Builds

Education (4 children)
├── Online Courses, eBooks, Tutorials, Certificates
```

### Category Helpers

```typescript
// Fetch for UI (parents with nested children)
import { getActiveCategoriesWithChildren } from '@workspace/db';

// Validate product references child category
import { validateChildCategory } from '@workspace/db';
const isValid = await validateChildCategory(categoryId);
```

---

## Auto-Key System

### Key Pool

- Each offer can have a `KeyPool`
- Keys stored encrypted (AES-256-GCM)
- Hash-based deduplication (SHA-256)
- Status: AVAILABLE → RESERVED → DELIVERED | INVALID

### Atomic Fulfillment

```sql
SELECT id FROM keys
WHERE pool_id = ? AND status = 'AVAILABLE'
ORDER BY created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED
```

- Thread-safe: No double-delivery
- Idempotent: Same key returned on retry
- Transactional: Key update + order status in single transaction

### Availability Rules

- Offer `status=active` but `availability=out_of_stock` when no keys
- Upload keys → automatically becomes `in_stock`
- Seller-controlled status vs system-computed availability

---

## Validation Rules

### Draft Creation (Minimal)

- Required: `sellerId`, `deliveryType`
- Optional: everything else

### Publishing (Strict)

- Required: `variantId`, `priceAmount > 0`, `currency`
- If MANUAL: `deliveryInstructions` required
- If AUTO_KEY: `keyPoolId` or `stockCount` required
- Variant must support chosen delivery type

### Category Validation

- MUST be child category (has parentId)
- MUST be active
- Validated at both API and DB levels

---

## Platform Settings

### Single-Row Settings Table

The platform uses a typed single-row `PlatformSettings` table:

```prisma
model PlatformSettings {
  id             String   @id @default(uuid())
  platformFeeBps Int      // Basis points (300 = 3%)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Enforcement:**

- Single row enforced via service logic (uses `findFirst()`, auto-creates default if missing)
- Seed script ensures exactly one row exists with default 300 bps (3%)
- No application logic allows multiple rows

**Configuration:**

- Default: 300 bps (3%)
- Range: 0-5000 bps (0-50%)
- Validation: Both Zod contracts and service validate range
- Admin endpoint: `PATCH /admin/settings/platform-fee`

---

## Pricing & Commission Model

### Platform Commission

- **Configurable**: Admin can set platform fee via API (0-50% range)
- **Storage**: Single-row `PlatformSettings` table, `platformFeeBps` field
- **Precision**: Basis points (bps) for accurate calculation (100 bps = 1%)
- **Max fee**: 5000 bps (50%) enforced by validation

### Price Components

```
Seller Price (base)    = Offer.priceAmount (what seller receives)
Platform Fee           = (Seller Price × platformFeeBps) / 10000
Buyer Pays (total)     = Seller Price + Platform Fee
```

### Example Calculation

- Seller price: $19.99 (1999 cents)
- Platform fee: 300 bps (3%)
- Fee amount: (1999 × 300) / 10000 = 60 cents ($0.60)
- Buyer pays: 1999 + 60 = 2059 cents ($20.59)

### Integer Math Only

All calculations use integer cents to avoid floating-point precision issues:

- Store prices as `Int` in cents
- Calculate fee using integer division: `(priceCents * feeBps) / 10000`
- Round using `Math.round()` for any division

### Seller UI Pricing Preview

The seller "Pricing & Delivery" step shows:

1. **Seller price** - Base amount seller enters and receives
2. **Platform fee** - Percentage and computed amount
3. **Buyer pays** - Total the buyer will pay at checkout

Preview fetches current platform fee via `GET /settings/platform-fee` and computes using client-side integer math.

---

## Seller vs Admin Responsibilities

### Admin (Future Phase)

- Manage CatalogProducts and CatalogVariants
- Approve/reject seller offers
- Manage categories
- Platform-wide settings (platform fee configuration)

### Seller

- Create offers for existing variants
- Upload keys to key pools
- Set pricing and delivery config
- Toggle offer active/inactive
- **CANNOT** create new catalog products
- **CANNOT** change platform commission rate

---

## API Endpoints Summary

### Catalog (Public)

| Method | Path                             | Description                          |
| ------ | -------------------------------- | ------------------------------------ |
| GET    | `/categories`                    | Active categories with children      |
| GET    | `/catalog/products`              | List products (filter by categoryId) |
| GET    | `/catalog/products/:id/variants` | Variants for product                 |

### Offers (Seller)

| Method | Path                 | Description            |
| ------ | -------------------- | ---------------------- |
| POST   | `/offers/draft`      | Save offer draft       |
| POST   | `/offers/publish`    | Publish offer          |
| PATCH  | `/offers/:id/status` | Toggle active/inactive |
| GET    | `/seller/offers`     | List seller's offers   |

### Key Pools (Seller)

| Method | Path                         | Description               |
| ------ | ---------------------------- | ------------------------- |
| POST   | `/key-pools`                 | Create key pool           |
| GET    | `/key-pools/:id`             | Get pool with counts      |
| POST   | `/key-pools/:id/keys/upload` | Bulk upload keys          |
| GET    | `/key-pools/:id/keys`        | List keys (metadata only) |
| DELETE | `/key-pools/:id/keys/:keyId` | Invalidate key            |

### Orders (Buyer)

| Method | Path                  | Description               |
| ------ | --------------------- | ------------------------- |
| POST   | `/orders`             | Create order              |
| POST   | `/orders/:id/pay`     | Pay (MVP stub)            |
| POST   | `/orders/:id/fulfill` | Atomic key delivery       |
| GET    | `/orders/:id`         | Order with delivered keys |

### Platform Settings

| Method | Path                           | Description                    |
| ------ | ------------------------------ | ------------------------------ |
| GET    | `/settings/platform-fee`       | Get current platform fee (bps) |
| PATCH  | `/admin/settings/platform-fee` | Update platform fee (admin)    |
