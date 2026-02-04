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

## Domain Model Principles

### Separation of Concerns

The marketplace follows a strict separation between **WHAT can be sold** (Catalog) and **HOW it is sold** (Offer):

**CatalogProduct / CatalogVariant (Admin-managed)**
- Defines WHAT products exist in the marketplace
- Specifies which delivery types are SUPPORTED (capabilities)
- NO delivery configuration or pricing

**Offer (Seller-created)**
- References a CatalogVariant
- Defines the ACTUAL delivery type chosen by the seller
- Contains ALL delivery configuration (pricing, instructions, SLA, key pool)
- Delivery config lives ONLY on Offer, never on Product/Catalog

### Why This Separation?

- **Clarity**: Catalog defines capabilities, Offer defines actuals
- **Flexibility**: Multiple sellers can offer the same variant with different delivery configs
- **Simplicity**: One place to look for delivery configuration (Offer)
- **Correctness**: Product/Catalog tables have no delivery-related columns except capability flags

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

**Core principle**: ALL delivery configuration lives on the Offer table.

```prisma
model Offer {
  id                       String       @id @default(uuid())
  sellerId                 String
  variantId                String       // FK to CatalogVariant
  status                   OfferStatus  // draft | active | inactive
  deliveryType             DeliveryType // AUTO_KEY | MANUAL (chosen by seller)
  
  // Pricing (always required)
  priceAmount              Int          // cents (never Float)
  currency                 Currency
  
  // AUTO_KEY delivery config (required when deliveryType = AUTO_KEY)
  keyPoolId                String?      // FK to KeyPool (1:1 relation)
  
  // MANUAL delivery config (required when deliveryType = MANUAL)
  stockCount               Int?         // Manual inventory tracking
  deliveryInstructions     String?      // How seller fulfills (REQUIRED to publish)
  estimatedDeliveryMinutes Int?         // SLA shown to buyers (REQUIRED to publish)
  
  // Optional seller metadata
  descriptionMarkdown      String?
  
  publishedAt              DateTime?
}
```

**Validation rules**:
- Variant must have `supportsAutoKey = true` if seller chooses `AUTO_KEY`
- Variant must have `supportsManual = true` if seller chooses `MANUAL`
- If MANUAL: `deliveryInstructions` and `estimatedDeliveryMinutes` are REQUIRED to publish
- If AUTO_KEY: `keyPoolId` is required (auto-created on publish)

---

## Offer-Level Delivery Configuration

**Key principle**: Delivery configuration is **Offer-level**, not Catalog/Product-level. The catalog defines capabilities; the seller's offer defines the actual config.

### How It Works

1. **Admin** creates `CatalogVariant` with capability flags:
   - `supportsAutoKey: true/false`
   - `supportsManual: true/false`

2. **Seller** creates `Offer` and chooses ONE delivery type:
   - Must choose a type that the variant supports
   - Delivery config fields are populated on the Offer table based on choice

3. **Validation** enforces required fields at publish time:
   - AUTO_KEY requires `keyPoolId` (or auto-created)
   - MANUAL requires `deliveryInstructions` + `estimatedDeliveryMinutes`

### AUTO_KEY Configuration (Offer-level)

When seller chooses `deliveryType = AUTO_KEY`:

- **keyPoolId** (required): FK to KeyPool containing encrypted keys
- KeyPool is 1:1 with Offer (auto-created on publish)
- Keys encrypted at rest (AES-256-GCM)
- Fulfillment is atomic with row-level locking
- Availability computed from key pool status

### MANUAL Configuration (Offer-level)

When seller chooses `deliveryType = MANUAL`:

**Required fields** (enforced at publish):
- **deliveryInstructions** (String): How the seller will fulfill orders
  - Plain text, operational instructions for fulfillment
  - NOT visible to buyers (internal use only)
  - Separate from `descriptionMarkdown` (buyer-facing marketing copy)
  - Editable in both creation wizard and manage offer screen
- **estimatedDeliveryMinutes** (Int): SLA shown to buyers
  - Preset choices in wizard: 15m, 1h, 6h, 24h, 3d, or custom (5-10080 minutes)
  - Editable in both creation wizard and manage offer screen

**Optional fields**:
- **stockCount** (Int): Manual inventory tracking
  - Editable in manage offer screen
- Buyer requirements collected via admin-defined templates (see Buyer Requirements System)

**Field Separation (Important)**:
- **deliveryInstructions**: Operational fulfillment process (seller-only, plain text)
- **descriptionMarkdown**: Marketing copy visible to buyers (Markdown, with preview)

### Variant Capability Flags

These flags on `CatalogVariant` define what's POSSIBLE, not what's CONFIGURED:

- `supportsAutoKey: true/false` - Can this variant be sold with automated keys?
- `supportsManual: true/false` - Can this variant be sold with manual fulfillment?
- If variant only supports one type, wizard auto-selects it
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
- If MANUAL: `deliveryInstructions` **required**, `estimatedDeliveryMinutes` **required**
- If AUTO_KEY: `keyPoolId` or `stockCount` required
- Variant must support chosen delivery type

### Category Validation

- MUST be child category (has parentId)
- MUST be active
- Validated at both API and DB levels

---

## Buyer Requirements System

### Overview

For manual fulfillment, sellers often need buyer information (account credentials, character names, etc.). This is handled via **admin-defined requirement templates**, not seller-defined fields.

**Key design decisions**:

- Templates are **admin-managed** (catalog-level), not seller-defined
- Templates are linked to **CatalogVariant** (granular per-variant requirements)
- Sellers can only add free-text instructions, NOT create custom fields
- Sensitive data (passwords, credentials) is **encrypted at rest**
- Only the seller owning the order can view buyer requirements

### Data Models

```prisma
// Admin-managed template
model RequirementTemplate {
  id          String   @id
  name        String   // e.g., "Netflix Account Delivery"
  description String?
  isActive    Boolean  @default(true)
}

// Individual fields within a template
model RequirementField {
  id          String   @id
  templateId  String
  key         String   // programmatic key: "email", "password"
  label       String   // UI label: "Netflix Email"
  type        RequirementFieldType // TEXT, EMAIL, NUMBER, SELECT, TEXTAREA, ACCOUNT_CREDENTIALS
  required    Boolean  @default(true)
  helpText    String?
  placeholder String?
  options     Json?    // For SELECT type
  validation  Json?    // { minLength, maxLength, pattern }
  sensitive   Boolean  @default(false) // If true, encrypted at rest
  sortOrder   Int
}

// Link template to variant
model CatalogVariant {
  // ... existing fields ...
  requirementTemplateId String? // Admin-assigned buyer requirements template
}

// Store buyer data on order
model Order {
  // ... existing fields ...
  requirementsPayload          Json?   // Non-sensitive buyer data
  requirementsPayloadEncrypted String? // Encrypted sensitive data (AES-256-GCM)
}
```

### Field Types

| Type | Description |
|------|-------------|
| TEXT | Single-line text input |
| EMAIL | Email address (validated format) |
| NUMBER | Numeric input |
| SELECT | Dropdown with predefined options |
| TEXTAREA | Multi-line text |
| ACCOUNT_CREDENTIALS | Special type for username/password pairs (always sensitive) |

### Security

- **Sensitive fields** are encrypted at rest using AES-256-GCM
- **Access control**: Only the seller owning the order can view buyer requirements
- **Logging**: Sensitive data is never logged
- **API responses**: Buyer view never includes requirements; seller view decrypts on demand

### Checkout Flow

1. Buyer selects variant → API returns requirements template fields
2. Frontend renders dynamic form based on template
3. Buyer submits order with `requirementsPayload`
4. Backend validates payload against template
5. Sensitive fields are encrypted before storage
6. Seller views order → sensitive fields decrypted for display

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

Sellers see pricing preview in TWO places:

1. **During Offer Creation** (wizard → Pricing & Config step)
   - Shown immediately as seller enters price
   - Updates live when price or currency changes
   
2. **In Manage Offer → Pricing tab**
   - Shown when editing existing offer pricing

Preview displays:
1. **Your price (seller receives)** - Base amount seller enters and receives
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
- View both base price (seller receives) and buyer price (with platform fee) in dashboard
- See pricing preview during offer creation and when editing pricing
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

| Method | Path                 | Description                                           |
| ------ | -------------------- | ----------------------------------------------------- |
| POST   | `/offers/draft`      | Save offer draft                                      |
| POST   | `/offers/publish`    | Publish offer                                         |
| PATCH  | `/offers/:id`        | Update offer (pricing, description, delivery settings)|
| PATCH  | `/offers/:id/status` | Toggle active/inactive                                |
| GET    | `/seller/offers`     | List seller's offers                                  |

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
| POST   | `/orders`             | Create order (with requirementsPayload) |
| POST   | `/orders/:id/pay`     | Pay (MVP stub)            |
| POST   | `/orders/:id/fulfill` | Atomic key delivery       |
| GET    | `/orders/:id`         | Order with delivered keys |

### Orders (Seller)

| Method | Path                  | Description               |
| ------ | --------------------- | ------------------------- |
| GET    | `/orders/seller`      | List seller's orders      |
| GET    | `/orders/seller/:id`  | Order details with buyer requirements |

### Buyer Requirements (Public)

| Method | Path                                    | Description               |
| ------ | --------------------------------------- | ------------------------- |
| GET    | `/catalog/variants/:id/requirements`    | Get requirements for checkout |

### Buyer Requirements (Admin)

| Method | Path                              | Description               |
| ------ | --------------------------------- | ------------------------- |
| GET    | `/admin/requirement-templates`    | List all templates        |
| GET    | `/admin/requirement-templates/:id`| Get template details      |
| POST   | `/admin/requirement-templates`    | Create template           |
| PATCH  | `/admin/requirement-templates/:id`| Update template           |
| DELETE | `/admin/requirement-templates/:id`| Delete template           |

### Platform Settings

| Method | Path                           | Description                    |
| ------ | ------------------------------ | ------------------------------ |
| GET    | `/settings/platform-fee`       | Get current platform fee (bps) |
| PATCH  | `/admin/settings/platform-fee` | Update platform fee (admin)    |
