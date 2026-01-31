# Market Monorepo Setup Guide

## Overview

This monorepo contains:
- **Apps**: `web`, `admin`, `seller` (Next.js), `api` (NestJS)
- **Packages**: `ui`, `contracts`, `db`, `eslint-config`, `typescript-config`

## Architecture

```
market/
├── apps/
│   ├── web/           # Customer-facing Next.js app
│   ├── admin/         # Admin Next.js app
│   ├── seller/        # Seller portal Next.js app
│   └── api/           # NestJS backend API
│       ├── src/
│       │   ├── config/          # Environment validation (Zod)
│       │   ├── health/          # Health check endpoint
│       │   ├── version/         # Version endpoint
│       │   ├── app.module.ts
│       │   └── main.ts          # Swagger setup
│       ├── .env.example
│       └── package.json
│
├── packages/
│   ├── ui/              # Shared React components
│   ├── contracts/       # API contracts (Zod schemas + OpenAPI)
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   │   ├── health.schema.ts    # HealthResponseSchema
│   │   │   │   ├── version.schema.ts   # VersionResponseSchema
│   │   │   │   └── user.schema.ts      # UserSchema
│   │   │   └── index.ts                # OpenAPI registry
│   │   └── package.json
│   │
│   ├── db/              # Prisma database client
│   │   ├── prisma/
│   │   │   └── schema.prisma           # User model
│   │   ├── src/
│   │   │   └── index.ts                # Singleton PrismaClient
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── eslint-config/   # Shared ESLint configs
│   └── typescript-config/ # Shared TypeScript configs
│
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database Package

```bash
# Copy env file
cp packages/db/.env.example packages/db/.env

# Edit packages/db/.env and update DATABASE_URL
# Example: postgresql://postgres:postgres@localhost:5432/market

# Generate Prisma Client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# OR run migrations (production)
pnpm db:migrate
```

### 3. Setup API

```bash
# Copy env file
cp apps/api/.env.example apps/api/.env

# Edit apps/api/.env and update variables:
# - DATABASE_URL (must match packages/db/.env)
# - PORT (default: 3001)
# - CORS_ORIGINS (comma-separated frontend URLs)
```

## Development

### Start All Apps

```bash
pnpm dev
```

This starts all apps in parallel:
- web: http://localhost:3000
- admin: http://localhost:3001
- seller: http://localhost:3002
- api: http://localhost:4000

### Start Individual Apps

```bash
# Next.js apps
pnpm dev:web      # Customer app
pnpm dev:admin    # Admin portal
pnpm dev:seller   # Seller portal

# API
pnpm dev:api      # NestJS API
```

### API Documentation

When API is running, Swagger docs are available at:
```
http://localhost:4000/docs
```

## API Endpoints

### Health Check
```
GET /health
Response: { "ok": true }
```

### Version Info
```
GET /version
Response: { "name": "Market API", "version": "0.0.1" }
```

## Database Commands

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema changes (dev)
pnpm db:push

# Create migration
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

## Build & Type Checking

```bash
# Build all apps
pnpm build

# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Format code
pnpm format
```

## Package Usage

### Using @workspace/contracts

```typescript
import { 
  HealthResponseSchema, 
  VersionResponseSchema, 
  UserSchema 
} from '@workspace/contracts';
import type { 
  HealthResponse, 
  VersionResponse, 
  User 
} from '@workspace/contracts';

// Validate data
const health = HealthResponseSchema.parse({ ok: true });

// Use inferred types
const user: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  createdAt: new Date().toISOString()
};
```

### Using @workspace/db

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

## Tech Stack

- **Monorepo**: pnpm workspaces + Turbo
- **Frontend**: Next.js 15 + React 19 + TailwindCSS 4
- **Backend**: NestJS + Zod validation
- **Database**: Prisma + PostgreSQL
- **API Docs**: Swagger/OpenAPI
- **Validation**: Zod (no class-validator)
- **TypeScript**: Strict mode enabled

## Key Features

✅ Framework-agnostic packages (no Nest/Next imports in shared code)  
✅ Single Prisma source for entire monorepo  
✅ Zod-based API contracts with OpenAPI  
✅ Environment validation with Zod  
✅ Singleton PrismaClient pattern  
✅ CORS enabled for all Next.js apps  
✅ Swagger documentation at /docs  
✅ No per-package node_modules (hoisted to root)  
✅ Workspace aliases (@workspace/*)  

## Environment Variables

### packages/db/.env
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/market?schema=public"
```

### apps/api/.env
```env
NODE_ENV=development
PORT=4000
APP_NAME=Market API
APP_VERSION=0.0.1
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/market?schema=public"
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

## Next Steps

1. Start PostgreSQL database
2. Run `pnpm db:push` to create tables
3. Run `pnpm dev` to start all services
4. Visit http://localhost:3001/docs for API documentation

## Troubleshooting

### Prisma Client not found
```bash
pnpm db:generate
```

### Port already in use
Update PORT in `apps/api/.env`

### Database connection failed
- Check PostgreSQL is running
- Verify DATABASE_URL in both `.env` files
- Ensure database exists

### Type errors in IDE
- Restart TypeScript server
- Run `pnpm install` to refresh workspace links
