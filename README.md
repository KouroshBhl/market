# Market - Digital Marketplace Monorepo

A multi-tenant digital marketplace built with Next.js, NestJS, and Prisma.

## Overview

This monorepo contains a complete marketplace platform with:

- **Customer storefront** - Browse and purchase digital products
- **Seller portal** - List and manage products/offers
- **Admin dashboard** - Platform management
- **Backend API** - RESTful API with OpenAPI/Swagger docs

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
pnpm install

# Setup database
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env
# Edit .env files with your PostgreSQL connection string

# Generate Prisma Client and push schema
pnpm db:generate
pnpm db:push

# (Optional) Seed catalog data
cd packages/db && pnpm db:seed:catalog && cd ../..
```

### Development

```bash
# Start all apps
pnpm dev

# Or start individually
pnpm dev:web      # http://localhost:3000
pnpm dev:admin    # http://localhost:3001
pnpm dev:seller   # http://localhost:3002
pnpm dev:api      # http://localhost:4000
```

## Architecture

### Apps

| App | Port | Description |
|-----|------|-------------|
| `apps/web` | 3000 | Customer marketplace (Next.js) |
| `apps/admin` | 3001 | Admin dashboard (Next.js) |
| `apps/seller` | 3002 | Seller portal (Next.js) |
| `apps/api` | 4000 | Backend API (NestJS) |

### Packages

| Package | Purpose |
|---------|---------|
| `@workspace/ui` | Shared UI components (shadcn-based) |
| `@workspace/contracts` | API contracts with Zod + OpenAPI |
| `@workspace/db` | Prisma client + database models |
| `@workspace/eslint-config` | Shared ESLint configs |
| `@workspace/typescript-config` | Shared TypeScript configs |

## Tech Stack

- **Monorepo**: pnpm workspaces + Turbo
- **Frontend**: Next.js 15, React 19, TailwindCSS 4
- **Backend**: NestJS, Zod validation
- **Database**: Prisma, PostgreSQL
- **API Docs**: Swagger/OpenAPI
- **Type Safety**: TypeScript strict mode

## API Documentation

Interactive Swagger docs available at:

```
http://localhost:4000/docs
```

OpenAPI JSON spec:

```
http://localhost:4000/api/openapi.json
```

## Available Commands

### Development

```bash
pnpm dev              # Start all apps
pnpm dev:api          # Start API only
pnpm dev:web          # Start web only
pnpm dev:admin        # Start admin only
pnpm dev:seller       # Start seller only
```

### Database

```bash
pnpm db:generate      # Generate Prisma Client
pnpm db:push          # Push schema (dev)
pnpm db:migrate       # Run migrations (prod)
pnpm db:studio        # Open Prisma Studio
```

### Build & Quality

```bash
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all packages
pnpm format           # Format code
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Guides

- [Getting Started](docs/guides/getting-started.md) - Complete setup guide
- [API Documentation](docs/guides/api-docs.md) - Swagger/OpenAPI setup
- [Port Configuration](docs/guides/ports.md) - Port assignments
- [Database Migrations](docs/guides/migrations.md) - Migration workflows
- [UI Components](docs/guides/ui-components.md) - Component guidelines

### Architecture & Specs

- [Monorepo Structure](docs/specs/monorepo-structure.md) - Package organization
- [Contract-First API](docs/specs/contract-first-api.md) - API design pattern
- [Marketplace Catalog](docs/specs/marketplace-catalog.md) - Catalog system
- [Product Wizard](docs/specs/product-wizard.md) - Product creation flow

See [docs/README.md](docs/README.md) for a complete documentation index.

## Key Features

✅ **Type-safe API contracts** - Zod schemas with TypeScript inference  
✅ **Auto-generated API docs** - Swagger updates automatically  
✅ **Catalog-based marketplace** - Admin-managed products + seller offers  
✅ **Design system enforcement** - ESLint rules for UI consistency  
✅ **No hardcoded colors** - Semantic theme tokens only  
✅ **Framework-agnostic packages** - Clean separation of concerns  
✅ **Single source of truth** - One Prisma schema, one contracts package

## Project Structure

```
market/
├── apps/
│   ├── web/              # Customer storefront
│   ├── admin/            # Admin dashboard
│   ├── seller/           # Seller portal
│   └── api/              # NestJS backend
├── packages/
│   ├── ui/               # Shared UI components
│   ├── contracts/        # API contracts (Zod + OpenAPI)
│   ├── db/               # Prisma client
│   ├── eslint-config/    # Shared ESLint configs
│   └── typescript-config/ # Shared TypeScript configs
├── docs/
│   ├── guides/           # How-to guides
│   ├── specs/            # Architecture decisions
│   └── _archive/         # Historical documents
├── package.json          # Root workspace config
├── pnpm-workspace.yaml   # Workspace definition
└── turbo.json            # Build pipeline
```

## Environment Variables

### Database (packages/db/.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/market"
```

### API (apps/api/.env)

```env
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/market"
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

## Troubleshooting

### Database connection failed

- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env` files
- Verify database exists

### Prisma Client not found

```bash
pnpm db:generate
```

### Port already in use

Change PORT in `apps/api/.env` or check which app is using the port

### Type errors in IDE

- Restart TypeScript server in your editor
- Run `pnpm install` to refresh workspace links

## License

MIT

## Contributing

See individual package READMEs for specific contribution guidelines.
