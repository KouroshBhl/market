# Port Standardization Summary

## Overview

Standardized ports across the monorepo to avoid conflicts and provide clear separation between frontend and backend services.

## Port Assignments

| App | Port | URL |
|-----|------|-----|
| **web** (Next.js) | 3000 | http://localhost:3000 |
| **admin** (Next.js) | 3001 | http://localhost:3001 |
| **seller** (Next.js) | 3002 | http://localhost:3002 |
| **api** (NestJS) | 4000 | http://localhost:4000 |

### Rationale

- **Frontend apps (3000-3002)**: Sequential ports for Next.js applications
- **Backend API (4000)**: Separate port range to avoid conflicts with frontend
- **Swagger docs**: http://localhost:4000/docs

## Changes Made

### 1. API Configuration Updates

#### apps/api/.env
```env
PORT=4000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

#### apps/api/.env.example
```env
PORT=4000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

#### apps/api/src/main.ts
```typescript
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
// Logs: 🚀 API running on: http://localhost:4000
```

#### apps/api/src/config/configuration.ts
```typescript
port: parseInt(process.env.PORT || '4000', 10),
```

#### apps/api/src/config/env.schema.ts
```typescript
PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('4000'),
```

### 2. Next.js App Scripts

#### apps/web/package.json
```json
{
  "scripts": {
    "dev": "next dev -p 3000 --turbopack",
    "start": "next start -p 3000"
  }
}
```

#### apps/admin/package.json
```json
{
  "scripts": {
    "dev": "next dev -p 3001 --turbopack",
    "start": "next start -p 3001"
  }
}
```

#### apps/seller/package.json
```json
{
  "scripts": {
    "dev": "next dev -p 3002 --turbopack",
    "start": "next start -p 3002"
  }
}
```

### 3. Documentation Updates

Updated all documentation files to reflect new port structure:
- SETUP.md
- STRUCTURE.md
- QUICKSTART.md
- API_FIX_SUMMARY.md

## Verification Commands

### Start Individual Apps

```bash
# API (port 4000)
pnpm dev:api
# Expected: 🚀 API running on: http://localhost:4000

# Web (port 3000)
pnpm dev:web
# Expected: Ready on http://localhost:3000

# Admin (port 3001)
pnpm dev:admin
# Expected: Ready on http://localhost:3001

# Seller (port 3002)
pnpm dev:seller
# Expected: Ready on http://localhost:3002
```

### Start All Apps

```bash
pnpm dev
# Starts all apps in parallel with correct ports
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:4000/health
# Response: {"ok":true}

# Version info
curl http://localhost:4000/version
# Response: {"name":"Market API","version":"0.0.1"}

# Swagger documentation
open http://localhost:4000/docs
```

## Testing Results

### ✅ API on Port 4000
```bash
$ pnpm --filter api start

[Nest] 37228  - 02/01/2026, 1:24:13 AM     LOG [NestApplication] Nest application successfully started
🚀 API running on: http://localhost:4000
📚 Swagger docs: http://localhost:4000/docs
```

### ✅ Health Endpoint
```bash
$ curl http://localhost:4000/health
{"ok":true}
```

### ✅ Version Endpoint
```bash
$ curl http://localhost:4000/version
{"name":"Market API","version":"0.0.1"}
```

### ✅ Swagger Docs
```bash
$ curl http://localhost:4000/docs
<!-- HTML for static distribution bundle build -->
<!DOCTYPE html>
<html lang="en">
...
```

## Benefits

1. **No Port Conflicts**: Each app has a dedicated port
2. **Clear Separation**: Frontend (3000s) vs Backend (4000s)
3. **Predictable URLs**: Easy to remember and document
4. **CORS Configuration**: API properly configured for all frontend apps
5. **Development Workflow**: All apps can run simultaneously

## Environment Variables

### API (.env)
```env
PORT=4000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

The API will:
- Listen on PORT env variable (default: 4000)
- Allow CORS from all frontend apps
- Log the final URL on startup

## Quick Reference

### URLs
- Web: http://localhost:3000
- Admin: http://localhost:3001
- Seller: http://localhost:3002
- API: http://localhost:4000
- Swagger: http://localhost:4000/docs

### Commands
```bash
# Development
pnpm dev              # All apps
pnpm dev:web          # Web only
pnpm dev:admin        # Admin only
pnpm dev:seller       # Seller only
pnpm dev:api          # API only

# Production
pnpm build            # Build all
pnpm start:api        # Start API (production)
```

## Notes

- All Next.js apps use explicit `-p` port flag for consistency
- API uses `process.env.PORT` with fallback to 4000
- CORS origins updated to include all three frontend URLs
- All documentation updated to reflect new port structure
