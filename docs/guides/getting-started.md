# Getting Started

Complete guide to set up and run the marketplace monorepo.

## Prerequisites

- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

```bash
# Copy environment files
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env

# Edit packages/db/.env and apps/api/.env
# Update DATABASE_URL to your PostgreSQL connection string
# Example: postgresql://postgres:postgres@localhost:5432/market

# Generate Prisma Client
pnpm db:generate

# Create database tables
pnpm db:push

# (Optional) Seed catalog data
cd packages/db && pnpm db:seed:catalog && cd ../..
```

### 3. Start Development

```bash
# Start all apps (web, admin, seller, api)
pnpm dev

# OR start individually
pnpm dev:api      # API at http://localhost:4000
pnpm dev:web      # Web at http://localhost:3000
pnpm dev:admin    # Admin at http://localhost:3001
pnpm dev:seller   # Seller at http://localhost:3002
```

## What You Get

### Apps

| App | Port | Description |
|-----|------|-------------|
| **web** | 3000 | Customer-facing marketplace |
| **admin** | 3001 | Admin dashboard |
| **seller** | 3002 | Seller portal |
| **api** | 4000 | NestJS backend API |

### Packages

| Package | Purpose |
|---------|---------|
| **@workspace/ui** | Shared UI components (shadcn-based) |
| **@workspace/contracts** | API contracts with Zod + OpenAPI |
| **@workspace/db** | Prisma client + database models |
| **@workspace/eslint-config** | Shared ESLint configs |
| **@workspace/typescript-config** | Shared TypeScript configs |

## API Documentation

Visit http://localhost:4000/docs for interactive Swagger documentation

## Test the API

```bash
# Health check
curl http://localhost:4000/health
# Response: {"ok":true}

# Version info
curl http://localhost:4000/version
# Response: {"name":"Market API","version":"0.0.1"}

# Get categories
curl http://localhost:4000/categories
```

## Available Commands

### Development

```bash
pnpm dev              # Start all apps in parallel
pnpm dev:api          # Start API only
pnpm dev:web          # Start web app only
pnpm dev:admin        # Start admin app only
pnpm dev:seller       # Start seller app only
```

### Database

```bash
pnpm db:generate      # Generate Prisma Client
pnpm db:push          # Push schema to database (dev)
pnpm db:migrate       # Run migrations (prod)
pnpm db:studio        # Open Prisma Studio GUI
```

### Build & Check

```bash
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all packages
pnpm format           # Format code
```

## Package Structure

```
market/
├── apps/
│   ├── web/          # Customer app (Next.js)
│   ├── admin/        # Admin portal (Next.js)
│   ├── seller/       # Seller portal (Next.js)
│   └── api/          # Backend API (NestJS)
│
└── packages/
    ├── ui/           # Shared UI components
    ├── contracts/    # API contracts (Zod + OpenAPI)
    ├── db/           # Prisma client
    ├── eslint-config/
    └── typescript-config/
```

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

## Next Steps

1. Review [API Documentation Guide](./api-docs.md)
2. Review [Port Configuration](./ports.md)
3. Review [Migration Guide](./migrations.md)
4. Review [UI Guidelines](./ui-components.md)
5. See [Architecture Documentation](../specs/) for implementation details
