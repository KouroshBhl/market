# @workspace/db

Prisma database client for the monorepo.

## Purpose
- Single Prisma source for entire monorepo
- PostgreSQL database
- Singleton pattern to avoid multiple clients in development

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `DATABASE_URL` in `.env`

3. Generate Prisma Client:
   ```bash
   pnpm db:generate
   ```

4. Push schema to database (development):
   ```bash
   pnpm db:push
   ```

5. Or run migrations (production):
   ```bash
   pnpm db:migrate
   ```

## Usage

```typescript
import { prisma } from '@workspace/db';
import type { User } from '@workspace/db';

// Query users
const users = await prisma.user.findMany();

// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com'
  }
});
```

## Scripts

- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:push` - Push schema to database (dev)
- `pnpm db:migrate` - Run migrations
- `pnpm db:studio` - Open Prisma Studio
