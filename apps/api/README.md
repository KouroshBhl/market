# Market API

NestJS backend service for the Market monorepo.

## Features

- ✅ NestJS framework
- ✅ TypeScript
- ✅ Zod-based environment validation
- ✅ Swagger/OpenAPI documentation at `/docs`
- ✅ Shared contracts via `@workspace/contracts`
- ✅ Prisma database via `@workspace/db`
- ✅ CORS enabled for Next.js apps

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update environment variables in `.env`

3. Install dependencies (from root):
   ```bash
   pnpm install
   ```

4. Generate Prisma Client:
   ```bash
   pnpm --filter @workspace/db db:generate
   ```

5. Push database schema:
   ```bash
   pnpm --filter @workspace/db db:push
   ```

## Development

```bash
# From root
pnpm --filter api dev

# Or directly
cd apps/api
pnpm dev
```

API will be available at:
- API: http://localhost:3001
- Swagger: http://localhost:3001/docs

## Endpoints

### Health
- `GET /health` - Health check

### Version
- `GET /version` - API version information

## Build

```bash
pnpm build
```

## Production

```bash
pnpm start:prod
```
