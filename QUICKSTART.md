# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Setup Database

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
```

### Step 3: Start Development

```bash
# Start all apps (web, admin, seller, api)
pnpm dev

# OR start individually
pnpm dev:api      # API at http://localhost:4000
pnpm dev:web      # Web at http://localhost:3000
pnpm dev:admin    # Admin at http://localhost:3001
pnpm dev:seller   # Seller at http://localhost:3002
```

## 📚 API Documentation

Visit http://localhost:4000/docs for Swagger documentation

## 🧪 Test API

```bash
# Health check
curl http://localhost:3001/health
# Response: {"ok":true}

# Version info
curl http://localhost:3001/version
# Response: {"name":"Market API","version":"0.0.1"}
```

## 📦 What Was Created

### New Packages

1. **packages/contracts** - API contracts using Zod
   - HealthResponseSchema
   - VersionResponseSchema
   - UserSchema
   - OpenAPI registry for Swagger

2. **packages/db** - Prisma database client
   - PostgreSQL setup
   - User model
   - Singleton PrismaClient

### New App

3. **apps/api** - NestJS backend
   - Environment validation (Zod)
   - Swagger at /docs
   - Health endpoint
   - Version endpoint
   - CORS enabled

## 🛠️ Available Commands

### Development
```bash
pnpm dev              # Start all apps
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

## 📁 Package Structure

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

## 🔧 Configuration Files

All environment files have been created:
- ✅ `packages/db/.env` (from .env.example)
- ✅ `apps/api/.env` (from .env.example)

You just need to:
1. Update DATABASE_URL in both files
2. Ensure PostgreSQL is running

## 🎯 What's Configured

### API (apps/api)
- ✅ NestJS with TypeScript
- ✅ Zod environment validation
- ✅ Swagger documentation at /docs
- ✅ CORS enabled for all Next.js apps
- ✅ Uses @workspace/contracts for schemas
- ✅ Uses @workspace/db for database

### Contracts (packages/contracts)
- ✅ Zod schemas with TypeScript inference
- ✅ OpenAPI/Swagger integration
- ✅ Framework-agnostic (works with any app)
- ✅ Schemas: Health, Version, User

### Database (packages/db)
- ✅ Prisma with PostgreSQL
- ✅ User model defined
- ✅ Singleton pattern for PrismaClient
- ✅ Migration support

### Root
- ✅ pnpm workspace configured
- ✅ Turbo build pipeline
- ✅ Unified scripts for all packages
- ✅ No per-package node_modules

## 🎉 Ready to Use!

Your monorepo now has:
- ✅ Shared API contracts (type-safe)
- ✅ Shared database (Prisma)
- ✅ Backend API (NestJS + Swagger)
- ✅ Everything builds and type checks
- ✅ Hot reload for development

## 📖 More Details

- See `SETUP.md` for detailed setup instructions
- See `STRUCTURE.md` for complete directory structure
- See individual package READMEs for usage examples

## 🐛 Troubleshooting

**Prisma Client not found?**
```bash
pnpm db:generate
```

**Port already in use?**
```bash
# Edit apps/api/.env and change PORT
```

**Database connection failed?**
```bash
# Ensure PostgreSQL is running
# Check DATABASE_URL in .env files
```

**Type errors in IDE?**
```bash
# Restart TypeScript server in your IDE
pnpm install
```
