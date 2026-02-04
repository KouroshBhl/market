# ARCHITECTURE

Single source of truth for monorepo structure, API design, database philosophy, and system boundaries.

---

## Monorepo Structure

```
market/
├── apps/
│   ├── web/        # Customer storefront (Next.js, port 3000)
│   ├── admin/      # Admin dashboard (Next.js, port 3001)
│   ├── seller/     # Seller portal (Next.js, port 3002)
│   └── api/        # Backend API (NestJS, port 4000)
│
├── packages/
│   ├── ui/                  # Stateless UI primitives (shadcn-based)
│   ├── contracts/           # Zod schemas + inferred types only
│   ├── db/                  # Prisma schema/client only
│   ├── eslint-config/       # Shared ESLint configs
│   └── typescript-config/   # Shared TypeScript configs
│
└── docs/
    ├── ARCHITECTURE.md      # This file
    ├── PRODUCT_DOMAIN.md
    ├── FRONTEND_SYSTEM.md
    ├── BACKEND_RULES.md
    └── WORKFLOWS.md
```

---

## Package Boundaries (STRICT)

### `packages/ui`
- **ALLOWED**: Stateless UI primitives, shadcn components, design tokens
- **FORBIDDEN**: React Query, TanStack Table logic, business hooks, API calls, env access

### `packages/contracts`
- **ALLOWED**: Zod schemas, inferred TypeScript types, OpenAPI registration
- **FORBIDDEN**: fetch calls, env access, runtime logic, database imports

### `packages/db`
- **ALLOWED**: Prisma schema, PrismaClient singleton, helper query functions
- **FORBIDDEN**: API calls, business logic, framework-specific code (NestJS/Next.js)

### `apps/*`
- **ALLOWED**: App state, React Query providers, TanStack Table columns, business flows, API calls
- **DO**: Import from `@workspace/ui`, `@workspace/contracts`, `@workspace/db`
- **DO NOT**: Deep import (e.g., `@workspace/ui/components/button` is forbidden)

---

## Port Configuration

| App | Port | URL |
|-----|------|-----|
| web | 3000 | http://localhost:3000 |
| admin | 3001 | http://localhost:3001 |
| seller | 3002 | http://localhost:3002 |
| api | 4000 | http://localhost:4000 |
| Swagger | 4000 | http://localhost:4000/docs |
| OpenAPI JSON | 4000 | http://localhost:4000/api/openapi.json |
| Prisma Studio | 5555 | http://localhost:5555 |

**CORS**: API configured to accept requests from all frontend apps (3000, 3001, 3002).

---

## Contract-First API Pattern

### Principle
Define Zod schemas BEFORE implementation. Documentation auto-generates.

### Flow
```
1. Create contract:     contracts/[feature]/[action].contract.ts
2. Export from registry: contracts/index.ts → ALL_CONTRACTS array
3. Implement controller: Use contract for validation
4. Verify:              pnpm test:contracts
5. Auto-documented:     Swagger UI at /docs updates automatically
```

### Contract Structure
```typescript
export const myContract = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: '/api/path',
  tags: ['GroupName'],
  summary: 'Short description',
  description: 'Longer description',
  
  request: {
    params: z.object({ ... }).optional(),
    query: z.object({ ... }).optional(),
    body: z.object({ ... }).optional(),
  },
  
  responses: {
    200: { description: 'Success', schema: ResponseSchema },
    400: { description: 'Validation error', schema: ErrorResponseSchema },
  },
} as const satisfies ApiContract;
```

### Rules
- **DO**: Use `.openapi('SchemaName')` on all exported schemas
- **DO**: Export types: `export type MyResponse = z.infer<typeof ResponseSchema>`
- **DO**: One contract per endpoint (separate files)
- **DO NOT**: Write OpenAPI manually - it generates from contracts
- **DO NOT**: Use class-validator - use Zod only

---

## OpenAPI/Swagger

### Endpoints
- **Swagger UI**: http://localhost:4000/docs
- **OpenAPI JSON**: http://localhost:4000/api/openapi.json

### Adding Documentation
1. Add NestJS decorators: `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBody`, `@ApiParam`, `@ApiQuery`
2. Restart API server
3. Swagger auto-updates

### Required Decorators
```typescript
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAll() { ... }
}
```

---

## Database Philosophy (Prisma)

### Single Source of Truth
- Schema lives in `packages/db/prisma/schema.prisma`
- One migration history for entire monorepo
- Singleton PrismaClient pattern (avoid multiple connections)

### Conventions
- **Column naming**: snake_case in DB, camelCase in Prisma (`@@map("snake_case")`)
- **Money**: Store as Int (cents), never Float
- **Dates**: Store as DateTime, return as ISO strings to frontend
- **UUIDs**: Use `@default(uuid())` for all IDs
- **Soft delete**: Consider `deletedAt` field vs hard delete

### Index Strategy
- Add indexes for frequent query patterns
- Composite indexes: `@@index([sellerId, status])`
- Foreign key indexes: Prisma auto-creates

### Helper Functions Location
- Put reusable queries in `packages/db/src/*.ts`
- Export from `packages/db/src/index.ts`
- Import in API as `import { helper } from '@workspace/db'`

---

## API Build System

### NestJS + Webpack
- Uses Webpack bundling for workspace package resolution
- Single output: `dist/main.js`
- Resolves ESM/CommonJS conflicts

### Key Files
- `apps/api/nest-cli.json` - Webpack enabled
- `apps/api/webpack.config.js` - Workspace aliases

### Commands
```bash
pnpm dev:api      # Watch mode with webpack
pnpm build:api    # Production build
pnpm start:api    # Run production bundle
```

---

## Environment Variables

### packages/db/.env
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/market"
```

### apps/api/.env
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://user:pass@localhost:5432/market"
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
ENCRYPTION_KEY=<64-char-hex-string>  # For key pool encryption
```

### Validation
- API uses Zod for env validation (`apps/api/src/config/env.schema.ts`)
- Missing required vars = startup failure with clear error

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turbo |
| Frontend | Next.js 15 + React 19 + TailwindCSS 4 |
| Backend | NestJS + Webpack bundling |
| Database | Prisma + PostgreSQL |
| Validation | Zod (no class-validator) |
| API Docs | Swagger/OpenAPI (@nestjs/swagger) |
| TypeScript | 5.7 strict mode |

---

## Design Principles

1. **Framework-agnostic packages**: No Nest/Next imports in `contracts` or `db`
2. **Single source of truth**: One Prisma schema, one contracts package
3. **Type safety**: Zod validation with TypeScript inference
4. **No per-package node_modules**: Hoisted to root
5. **Workspace aliases**: Always use `@workspace/*`
