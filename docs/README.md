# Documentation Index

Welcome to the Market marketplace documentation. This directory contains guides, architecture decisions, and historical records.

## Quick Links

### For New Developers

Start here to get up and running:

1. [Getting Started](guides/getting-started.md) - Installation and setup
2. [Port Configuration](guides/ports.md) - App port assignments
3. [API Documentation](guides/api-docs.md) - Using Swagger/OpenAPI

### For Feature Development

Understand the architecture before building:

- [Monorepo Structure](specs/monorepo-structure.md) - Package organization
- [Contract-First API](specs/contract-first-api.md) - API design pattern
- [Marketplace Catalog](specs/marketplace-catalog.md) - Product catalog system
- [Product Wizard](specs/product-wizard.md) - Product creation flow

### For Operations

Database and deployment guides:

- [Database Migrations](guides/migrations.md) - Migration workflows
- [UI Components](guides/ui-components.md) - Design system guidelines

## Documentation Structure

### `guides/` - How-To Guides

Step-by-step instructions for common tasks:

- **[getting-started.md](guides/getting-started.md)** - Complete setup guide from scratch
- **[api-docs.md](guides/api-docs.md)** - Setting up and using Swagger documentation
- **[ports.md](guides/ports.md)** - Port assignments and CORS configuration
- **[migrations.md](guides/migrations.md)** - Database migration workflows
- **[ui-components.md](guides/ui-components.md)** - UI component usage and ESLint rules

### `specs/` - Architecture & Specifications

Design decisions and implementation details:

- **[monorepo-structure.md](specs/monorepo-structure.md)** - Complete directory tree and package dependencies
- **[contract-first-api.md](specs/contract-first-api.md)** - API contract pattern with Zod + OpenAPI
- **[marketplace-catalog.md](specs/marketplace-catalog.md)** - Catalog-based marketplace architecture
- **[product-wizard.md](specs/product-wizard.md)** - Multi-step product creation flow

### `_archive/` - Historical Records

One-off implementation summaries and fix reports:

- **2026-02/** - February 2026 implementation logs
  - Various fix summaries, implementation notes, and completed task reports
  - Kept for historical reference and audit trail

## Documentation Principles

### What Goes Where

**Guides** (`guides/`)
- Step-by-step instructions
- How to set up, configure, or use a feature
- Practical, actionable content
- Should remain relevant over time

**Specs** (`specs/`)
- Architectural decisions
- System design documents
- Implementation specifications
- Why and how features are built

**Archive** (`_archive/YYYY-MM/`)
- One-off AI-generated reports
- Completed task summaries
- Historical fix logs
- Time-sensitive status reports

### Writing New Documentation

When adding documentation:

1. **Guides** - Focus on "how" and "what steps"
2. **Specs** - Focus on "why" and "how it works"
3. **Keep it current** - Update guides when features change
4. **Archive old content** - Move outdated summaries to `_archive/`

## Key Concepts

### Monorepo Structure

This project uses pnpm workspaces with Turbo for build orchestration. Apps consume shared packages via `@workspace/*` aliases.

### Contract-First API

All API endpoints are defined with Zod schemas before implementation, enabling:
- Type-safe contracts between frontend and backend
- Auto-generated OpenAPI documentation
- Request/response validation

### Catalog System

The marketplace uses a catalog-based model:
- **CatalogProduct** - Admin-managed product pages
- **CatalogVariant** - Region/duration/edition combinations
- **Offer** - Seller listings for specific variants

### Design System

UI consistency is enforced through:
- Shared `@workspace/ui` package with shadcn components
- ESLint rules preventing raw HTML elements
- Semantic theme tokens (no hardcoded colors)

## Finding Answers

### "How do I...?"

Check `guides/` first. Common questions:

- Set up the project → [getting-started.md](guides/getting-started.md)
- Add API endpoints → [api-docs.md](guides/api-docs.md)
- Run database migrations → [migrations.md](guides/migrations.md)
- Use UI components → [ui-components.md](guides/ui-components.md)

### "How does X work?"

Check `specs/` for architecture details:

- API contracts → [contract-first-api.md](specs/contract-first-api.md)
- Product catalog → [marketplace-catalog.md](specs/marketplace-catalog.md)
- Product creation → [product-wizard.md](specs/product-wizard.md)

### "What changed in...?"

Check `_archive/YYYY-MM/` for historical implementation notes.

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turbo |
| Frontend | Next.js 15 + React 19 |
| Styling | TailwindCSS 4 + shadcn/ui |
| Backend | NestJS |
| Database | Prisma + PostgreSQL |
| Validation | Zod |
| API Docs | Swagger/OpenAPI |
| Type System | TypeScript 5.7 (strict) |

## Port Assignments

| App | Port | URL |
|-----|------|-----|
| web | 3000 | http://localhost:3000 |
| admin | 3001 | http://localhost:3001 |
| seller | 3002 | http://localhost:3002 |
| api | 4000 | http://localhost:4000 |
| Swagger | 4000 | http://localhost:4000/docs |

## Useful Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm dev:api          # Start API only

# Database
pnpm db:generate      # Generate Prisma Client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio

# Quality
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm typecheck        # Type check all packages
```

## Contributing to Docs

When adding new documentation:

1. Place in appropriate directory (`guides/` or `specs/`)
2. Use clear, descriptive filenames (kebab-case)
3. Add entry to this index
4. Link related docs together
5. Keep it up-to-date as features evolve

## Questions?

If you can't find what you're looking for:

1. Search existing docs (Cmd/Ctrl+F)
2. Check package-specific READMEs in `packages/*/README.md`
3. Review the root README.md
4. Ask the team or check git history
