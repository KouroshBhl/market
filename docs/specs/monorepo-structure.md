# Monorepo Structure

## Complete Directory Tree

```
market/
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── README.md
├── docs/
│   ├── README.md
│   ├── guides/              # How-to guides
│   ├── specs/               # Architecture docs
│   └── _archive/            # Historical records
│
├── apps/
│   ├── web/                      # Customer Next.js app (port 3000)
│   │   ├── app/
│   │   ├── components/
│   │   ├── package.json
│   │   └── ...
│   │
│   ├── admin/                    # Admin Next.js app (port 3002)
│   │   ├── app/
│   │   ├── components/
│   │   ├── package.json
│   │   └── ...
│   │
│   ├── seller/                   # Seller Next.js app (port 3003)
│   │   ├── app/
│   │   ├── components/
│   │   ├── package.json
│   │   └── ...
│   │
│   └── api/                      # NestJS Backend (port 3001)
│       ├── src/
│       │   ├── config/
│       │   │   ├── configuration.ts
│       │   │   ├── env.schema.ts
│       │   │   └── env.validation.ts
│       │   ├── health/
│       │   │   ├── health.controller.ts
│       │   │   └── health.module.ts
│       │   ├── version/
│       │   │   ├── version.controller.ts
│       │   │   └── version.module.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── .env
│       ├── .env.example
│       ├── .eslintrc.js
│       ├── .gitignore
│       ├── nest-cli.json
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
└── packages/
    ├── ui/                       # Shared UI components
    │   ├── src/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── lib/
    │   │   ├── styles/
    │   │   └── index.ts
    │   ├── package.json
    │   └── ...
    │
    ├── contracts/                # API Contracts (Zod + OpenAPI)
    │   ├── src/
    │   │   ├── schemas/
    │   │   │   ├── health.schema.ts    # { ok: boolean }
    │   │   │   ├── version.schema.ts   # { name, version }
    │   │   │   ├── user.schema.ts      # { id, email, createdAt }
    │   │   │   └── index.ts
    │   │   └── index.ts                # Exports + OpenAPI registry
    │   ├── package.json                # @workspace/contracts
    │   ├── tsconfig.json
    │   └── README.md
    │
    ├── db/                       # Prisma Database Client
    │   ├── prisma/
    │   │   └── schema.prisma           # User model
    │   ├── src/
    │   │   └── index.ts                # Singleton PrismaClient
    │   ├── .env
    │   ├── .env.example
    │   ├── package.json                # @workspace/db
    │   ├── tsconfig.json
    │   └── README.md
    │
    ├── eslint-config/            # Shared ESLint configs
    │   ├── base.js
    │   ├── next.js
    │   ├── react-internal.js
    │   └── package.json
    │
    └── typescript-config/        # Shared TypeScript configs
        ├── base.json
        ├── nextjs.json
        ├── react-library.json
        └── package.json
```

## Package Dependencies

### apps/api → dependencies
- `@workspace/contracts` (Zod schemas)
- `@workspace/db` (Prisma client)
- `@nestjs/*` (framework)
- `zod` (validation)

### apps/web, apps/admin, apps/seller → dependencies
- `@workspace/ui` (shared components)
- Can also use `@workspace/contracts` (for API types)

### packages/contracts → dependencies
- `zod` (schema validation)
- `@asteasolutions/zod-to-openapi` (OpenAPI generation)

### packages/db → dependencies
- `@prisma/client` (database client)
- `prisma` (dev dependency)

## Key Files

### Root Configuration
- `pnpm-workspace.yaml` - Workspace definition
- `turbo.json` - Build pipeline configuration
- `package.json` - Root scripts and dev dependencies

### API Files
- `apps/api/src/main.ts` - Swagger setup + CORS
- `apps/api/src/config/env.validation.ts` - Zod env validation
- `apps/api/src/health/health.controller.ts` - Health endpoint
- `apps/api/src/version/version.controller.ts` - Version endpoint

### Contracts Files
- `packages/contracts/src/schemas/*.schema.ts` - Zod schemas
- `packages/contracts/src/index.ts` - OpenAPI registry

### Database Files
- `packages/db/prisma/schema.prisma` - Database schema
- `packages/db/src/index.ts` - Singleton PrismaClient

## Workspace Commands

### Root level (package.json)
```json
{
  "scripts": {
    "dev": "pnpm -r --parallel --filter \"./apps/**\" dev",
    "dev:web": "pnpm --filter web dev",
    "dev:seller": "pnpm --filter seller dev",
    "dev:admin": "pnpm --filter admin dev",
    "dev:api": "pnpm --filter api dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo check-types",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "db:generate": "pnpm --filter @workspace/db db:generate",
    "db:push": "pnpm --filter @workspace/db db:push",
    "db:migrate": "pnpm --filter @workspace/db db:migrate",
    "db:studio": "pnpm --filter @workspace/db db:studio"
  }
}
```

## Ports

- **web**: 3000
- **admin**: 3001
- **seller**: 3002
- **api**: 4000
- **Swagger docs**: http://localhost:4000/docs

## Technology Summary

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turbo |
| Frontend | Next.js 15 + React 19 |
| Styling | TailwindCSS 4 |
| Backend | NestJS |
| Database | Prisma + PostgreSQL |
| Validation | Zod (no class-validator) |
| API Docs | Swagger/OpenAPI |
| Type System | TypeScript 5.7 (strict) |

## Design Principles

1. **Framework-agnostic packages** - No Nest/Next imports in `contracts` or `db`
2. **Single source of truth** - One Prisma schema, one contracts package
3. **Type safety** - Zod validation with TypeScript inference
4. **Singleton patterns** - PrismaClient uses singleton to avoid multiple instances
5. **Workspace optimization** - No per-package node_modules
6. **Developer experience** - Hot reload, Swagger docs, type-safe APIs
