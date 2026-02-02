# Database Migration Guide

Instructions for applying database schema changes.

## Quick Migration (Development)

For development environments with no important data:

```bash
cd packages/db

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Push schema changes
pnpm prisma db push

# Regenerate Prisma Client
pnpm prisma generate

# (Optional) Seed catalog data
pnpm db:seed:catalog
```

## Production Migration

For production or environments with data you want to keep:

### 1. Create Migration

```bash
cd packages/db

# Create a new migration
pnpm prisma migrate dev --name add_new_feature

# This will:
# - Generate SQL migration file in prisma/migrations/
# - Apply migration to development database
# - Regenerate Prisma Client
```

### 2. Review Migration SQL

Check the generated SQL file in `prisma/migrations/TIMESTAMP_add_new_feature/migration.sql`

Make sure it:
- Doesn't drop important tables
- Preserves existing data
- Has proper constraints

### 3. Apply to Production

```bash
# Deploy migrations to production database
pnpm prisma migrate deploy
```

## Seeding Data

### Seed Catalog Products

```bash
cd packages/db
pnpm db:seed:catalog
```

This creates:
- Parent category: Games
- Child category: World of Warcraft
- Product: World of Warcraft - Game Time
- Variants: EU/US/GLOBAL × 30/60/90 days

### Custom Seed Script

Create a seed script in `packages/db/prisma/seed-custom.ts`:

```typescript
import { prisma } from '../src';

async function main() {
  // Your seed logic here
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Add to `packages/db/package.json`:

```json
{
  "scripts": {
    "db:seed:custom": "tsx prisma/seed-custom.ts"
  }
}
```

## Common Tasks

### Generate Prisma Client After Schema Changes

```bash
pnpm db:generate
```

### Push Schema Changes (Dev Only)

```bash
# Push without creating migration file
pnpm db:push
```

**Warning:** This skips migration history. Use only in development.

### Open Prisma Studio

```bash
pnpm db:studio
```

View and edit data in your browser at http://localhost:5555

### Reset Database

```bash
# WARNING: Deletes all data and migrations
pnpm prisma migrate reset
```

## Migration Best Practices

1. **Always create migrations for production changes**
   - Use `prisma migrate dev` in development
   - Use `prisma migrate deploy` in production

2. **Test migrations on a copy of production data**
   - Restore production backup to staging
   - Run migration on staging first
   - Verify data integrity

3. **Make migrations backward compatible when possible**
   - Add columns as nullable first
   - Backfill data in separate step
   - Make column required in next migration

4. **Keep migrations small and focused**
   - One logical change per migration
   - Easier to review and rollback if needed

5. **Never edit migration files after they're applied**
   - Create a new migration to fix issues
   - Migration files should be immutable once deployed

## Rollback Strategy

Prisma doesn't have built-in rollback. To undo a migration:

1. **Create a reverse migration:**
   ```bash
   pnpm prisma migrate dev --name revert_feature_x
   ```
   
2. **Manually write SQL to undo changes**
   
3. **Or restore from backup** (recommended for production)

## Troubleshooting

### Migration failed halfway

```bash
# Mark as rolled back
pnpm prisma migrate resolve --rolled-back MIGRATION_NAME

# Fix the issue
# Create new migration
pnpm prisma migrate dev
```

### Prisma Client out of sync

```bash
pnpm db:generate
```

### Schema drift detected

```bash
# Development: Reset and regenerate
pnpm prisma migrate reset

# Production: Create migration to fix
pnpm prisma migrate dev
```

### Database connection failed

Check:
- PostgreSQL is running
- DATABASE_URL is correct in `.env`
- Database exists
- User has permissions

## Example: Adding a New Model

1. **Edit schema.prisma:**

```prisma
model Review {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  rating    Int
  comment   String?
  createdAt DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id])

  @@map("reviews")
}
```

2. **Create migration:**

```bash
cd packages/db
pnpm prisma migrate dev --name add_reviews
```

3. **Verify migration applied:**

```bash
pnpm db:studio
# Check that reviews table exists
```

4. **Commit migration files:**

```bash
git add prisma/migrations
git commit -m "Add reviews model"
```

## Additional Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
