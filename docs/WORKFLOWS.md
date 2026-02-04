# WORKFLOWS

Single source of truth for setup, development, testing, and operational procedures.

---

## Quick Start (New Developer)

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env
# Edit both files with your DATABASE_URL

# 3. Setup database
pnpm db:generate
pnpm db:push

# 4. Seed data (optional)
cd packages/db && pnpm db:seed && cd ../..

# 5. Start development
pnpm dev
```

### Verify Setup

```bash
# API health check
curl http://localhost:4000/health
# Expected: {"ok":true}

# Swagger docs
open http://localhost:4000/docs

# Categories endpoint
curl http://localhost:4000/categories
```

---

## Daily Development

### Start All Apps

```bash
pnpm dev
```

### Start Individual Apps

```bash
pnpm dev:api      # http://localhost:4000
pnpm dev:web      # http://localhost:3000
pnpm dev:admin    # http://localhost:3001
pnpm dev:seller   # http://localhost:3002
```

### After Schema Changes

```bash
pnpm db:generate  # Regenerate Prisma Client
pnpm db:push      # Apply to dev database
# Restart API server
```

### View Database

```bash
pnpm db:studio    # http://localhost:5555
```

---

## Database Operations

### Development Workflow

```bash
# Make schema changes in packages/db/prisma/schema.prisma
# Then:
pnpm db:push      # Apply changes (no migration file)
pnpm db:generate  # Regenerate client
# Restart API
```

### Production Workflow

```bash
# Create migration
pnpm prisma migrate dev --name feature_name

# Review generated SQL in prisma/migrations/

# Deploy to production
pnpm prisma migrate deploy
```

### Reset Database (Development Only)

```bash
cd packages/db
pnpm prisma migrate reset  # WARNING: Deletes all data
pnpm db:generate
```

### Seed Data

```bash
# Categories + catalog
cd packages/db
pnpm db:seed        # Main seed
pnpm db:seed:catalog # Catalog-specific
```

---

## Build & Quality

### Full Build

```bash
pnpm build
```

### Linting

```bash
pnpm lint           # All packages
pnpm lint:ui        # UI-specific rules (color tokens)
pnpm --filter seller lint  # Specific app
```

### Type Checking

```bash
pnpm typecheck
```

### Format Code

```bash
pnpm format
```

---

## Testing

### Contract Tests

```bash
cd apps/api
pnpm test:contracts
```

Verifies:

- All contracts registered
- No duplicate paths
- OpenAPI generates correctly

### Manual API Testing

```bash
# Categories
curl http://localhost:4000/categories

# Catalog products
curl http://localhost:4000/catalog/products

# Platform fee settings (public)
curl http://localhost:4000/settings/platform-fee
# Expected: {"platformFeeBps":300,"platformFeePercent":3,"updatedAt":"2026-02-04T..."}

# Update platform fee (admin only - range: 0-5000 bps)
curl -X PATCH http://localhost:4000/admin/settings/platform-fee \
  -H "Content-Type: application/json" \
  -d '{"platformFeeBps":350}'
# Expected: {"platformFeeBps":350,"platformFeePercent":3.5,"updatedAt":"2026-02-04T..."}

# Test validation error (out of range)
curl -X PATCH http://localhost:4000/admin/settings/platform-fee \
  -H "Content-Type: application/json" \
  -d '{"platformFeeBps":6000}'
# Expected 400: "Platform fee must be between 0 and 5000 bps (0-50%)"

# Create offer draft
curl -X POST http://localhost:4000/offers/draft \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "deliveryType": "MANUAL"
  }'

# Publish MANUAL offer (requires deliveryInstructions + estimatedDeliveryMinutes)
curl -X POST http://localhost:4000/offers/publish \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "variantId": "<variant-uuid>",
    "deliveryType": "MANUAL",
    "priceAmount": 1999,
    "currency": "USD",
    "deliveryInstructions": "I will send account credentials via chat within the SLA",
    "estimatedDeliveryMinutes": 60
  }'
# Note: Publishing MANUAL without deliveryInstructions or estimatedDeliveryMinutes returns 400

# Get requirements for variant (checkout flow)
curl http://localhost:4000/catalog/variants/<variant-uuid>/requirements
# Expected: {"hasRequirements":true,"template":{"id":"...","name":"...","fields":[...]}} or {"hasRequirements":false,"template":null}

# Create order with buyer requirements
curl -X POST http://localhost:4000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "00000000-0000-0000-0000-000000000002",
    "offerId": "<offer-uuid>",
    "requirementsPayload": {
      "email": "buyer@example.com",
      "password": "secretpassword"
    }
  }'
# Note: Sensitive fields are encrypted at rest

# Get seller order view (includes decrypted requirements)
curl "http://localhost:4000/orders/seller/<order-uuid>?sellerId=00000000-0000-0000-0000-000000000001"
# Returns order with buyer-provided requirements for manual fulfillment

# Admin: Create requirement template
curl -X POST http://localhost:4000/admin/requirement-templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Netflix Account Delivery",
    "description": "Requirements for Netflix account orders",
    "fields": [
      {"key": "email", "label": "Netflix Email", "type": "EMAIL", "required": true},
      {"key": "password", "label": "Account Password", "type": "TEXT", "required": true, "sensitive": true}
    ]
  }'

# Admin: List all requirement templates
curl http://localhost:4000/admin/requirement-templates
```

### Swagger UI Testing

1. Open http://localhost:4000/docs
2. Find endpoint
3. Click "Try it out"
4. Fill parameters
5. Execute

---

## Adding New Features

### New API Endpoint

```bash
# 1. Create contract
# apps/api/src/contracts/feature/action.contract.ts

# 2. Export from registry
# apps/api/src/contracts/index.ts

# 3. Implement controller + service

# 4. Add Swagger decorators

# 5. Test
pnpm test:contracts
curl http://localhost:4000/new-endpoint
```

### New UI Component

```bash
# 1. Add from shadcn
pnpm dlx shadcn@latest add component-name -c apps/seller

# 2. Export from packages/ui/src/index.ts
export { ComponentName } from './components/component-name';

# 3. Use in app
import { ComponentName } from '@workspace/ui';
```

### New Database Model

```bash
# 1. Edit packages/db/prisma/schema.prisma

# 2. Apply changes
pnpm db:push
pnpm db:generate

# 3. Add contracts in packages/contracts/src/schemas/

# 4. Export from packages/contracts/src/index.ts

# 5. Restart API
```

---

## Troubleshooting

### Prisma Client Not Found

```bash
pnpm db:generate
```

### API Won't Start

```bash
# Check for port conflicts
lsof -i :4000

# Verify env files exist
ls -la apps/api/.env packages/db/.env

# Check database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Type Errors After Changes

```bash
# Restart TypeScript server in editor
# Or regenerate Prisma client
pnpm db:generate
```

### Swagger Not Showing Endpoints

1. Check controller has `@ApiTags` decorator
2. Module imported in `app.module.ts`
3. Restart API server
4. Clear browser cache

### Categories Not Loading

```bash
# Check seed ran
cd packages/db
pnpm db:studio
# Verify categories table has data

# If empty, seed
pnpm db:seed
```

### Frontend Can't Connect to API

```bash
# Check API is running
curl http://localhost:4000/health

# Check CORS config in apps/api/.env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

---

## Environment Management

### Required Variables

**packages/db/.env**

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/market"
```

**apps/api/.env**

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://user:pass@localhost:5432/market"
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Common Commands Reference

### Root Level

```bash
pnpm dev              # Start all apps
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all
pnpm format           # Format code
pnpm lint:ui          # Check UI color rules
```

### Database

```bash
pnpm db:generate      # Generate Prisma Client
pnpm db:push          # Push schema (dev)
pnpm db:migrate       # Run migrations (prod)
pnpm db:studio        # GUI browser
pnpm db:seed          # Seed data
```

### Individual Apps

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:admin
pnpm dev:seller
```

### Package-Specific

```bash
pnpm --filter @workspace/db db:generate
pnpm --filter seller lint
pnpm --filter api build
```

---

## Verification Checklist

### After Fresh Clone

- [ ] `pnpm install` succeeds
- [ ] `.env` files configured
- [ ] `pnpm db:push` succeeds
- [ ] `pnpm dev:api` starts without errors
- [ ] `curl http://localhost:4000/health` returns `{"ok":true}`
- [ ] Swagger loads at http://localhost:4000/docs
- [ ] Frontend loads at http://localhost:3002
- [ ] Platform fee settings endpoint works: `curl http://localhost:4000/settings/platform-fee`

### After Schema Changes

- [ ] `pnpm db:generate` succeeds
- [ ] `pnpm db:push` succeeds
- [ ] API restarts without errors
- [ ] New fields appear in Prisma Studio
- [ ] Contracts updated in `packages/contracts`
- [ ] Seed ensures single PlatformSettings row exists

### Seller Pricing Preview

**During Offer Creation (Wizard):**
- [ ] Navigate to "New Offer" wizard
- [ ] Proceed to "Pricing & Delivery" step
- [ ] Enter price (e.g., 19.99)
- [ ] Pricing preview card appears immediately showing:
  - Your price (seller receives): USD 19.99
  - Platform fee (3.00%): +USD 0.60
  - Buyer pays: USD 20.59
- [ ] Change price → preview updates live
- [ ] Change currency → preview updates live

**In Manage Offer (Pricing Tab):**
- [ ] Navigate to existing offer "Pricing" tab
- [ ] Label shows "Price (USD) *" or selected currency
- [ ] Enter or modify price
- [ ] Preview card shows calculated buyer price with platform fee

### Manual Offer Publishing

- [ ] Navigate to "New Offer" wizard
- [ ] Select MANUAL delivery type
- [ ] Proceed to "Pricing & Delivery" step
- [ ] Verify label shows "Delivery Instructions * (required)" (NOT optional)
- [ ] Verify SLA presets appear: 15m, 1h, 6h, 24h, 3d, Custom
- [ ] Try to proceed without delivery instructions → blocked
- [ ] Try to proceed without selecting SLA → blocked
- [ ] Enter delivery instructions + select SLA → can proceed
- [ ] On Review step, verify both values are shown
- [ ] Publish succeeds with both required fields

### Buyer Requirements (Checkout)

- [ ] Variant has requirement template assigned (via admin)
- [ ] `GET /catalog/variants/:id/requirements` returns template with fields
- [ ] Checkout form renders dynamic fields based on template
- [ ] Required fields are enforced
- [ ] Email fields validate format
- [ ] `POST /orders` with requirementsPayload succeeds
- [ ] Sensitive fields (password, etc.) are encrypted in DB
- [ ] `GET /orders/seller/:id` returns decrypted requirements for seller
- [ ] Non-owner seller cannot view order → 403 Forbidden

**In Seller Dashboard Table:**
- [ ] View offers list
- [ ] Pricing column shows BOTH:
  - Base: USD 19.99 (seller receives)
  - Buyer: USD 20.59 (with platform fee)
- [ ] Both prices clearly labeled and visible

### Before PR

- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] API endpoints tested
- [ ] Swagger documentation correct
- [ ] No hardcoded colors (run `pnpm lint:ui`)
- [ ] Platform fee endpoints in Swagger at /docs

---

## Deployment Notes

### Build for Production

```bash
pnpm build
```

### Database Migration

```bash
pnpm prisma migrate deploy
```

### Environment Variables

- Set all required env vars in production
- Use secrets manager for `ENCRYPTION_KEY`
- Ensure `CORS_ORIGINS` includes production domains

### Post-Deploy Verification

```bash
curl https://api.production.com/health
curl https://api.production.com/version
```
