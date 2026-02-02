# NestJS API Scripts Fix Summary

## Problem

The API dev/start scripts were failing with:
```
Error: Cannot find module '.../apps/api/dist/main'
```

The issue was caused by:
1. Module format mismatch between ESM packages (contracts) and CommonJS API
2. Complex dist output structure due to workspace path aliases
3. TypeScript compiling workspace packages into nested directories

## Solution

Configured NestJS to use **Webpack bundling** which:
- Bundles all dependencies (including workspace packages) into a single file
- Resolves module format issues
- Creates clean dist output structure
- Works seamlessly in both dev and production modes

## Changes Made

### 1. apps/api/package.json
```json
{
  "scripts": {
    "build": "nest build --webpack",
    "dev": "nest start --watch --webpack",
    "start": "node dist/main.js",
    "start:prod": "node dist/main.js"
  },
  "devDependencies": {
    // Added:
    "ts-loader": "^9.5.1",
    "webpack": "^5.104.1"
  }
}
```

### 2. apps/api/nest-cli.json
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "webpackConfigPath": "webpack.config.js"
  }
}
```

### 3. apps/api/webpack.config.js (NEW)
```javascript
const path = require('path');

module.exports = (options, webpack) => {
  return {
    ...options,
    entry: './src/main.ts',
    externals: [],
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      ...options.resolve,
      alias: {
        '@workspace/contracts': path.resolve(__dirname, '../../packages/contracts/src'),
        '@workspace/db': path.resolve(__dirname, '../../packages/db/src'),
      },
    },
  };
};
```

### 4. Root package.json
```json
{
  "scripts": {
    "build:api": "pnpm --filter api build",
    "dev:api": "pnpm --filter api dev",
    "start:api": "pnpm --filter api start"
  }
}
```

## Build Output

### Before (Broken)
```
dist/
├── apps/
│   └── api/
│       └── src/
│           └── main.js  ← Nested structure, module issues
└── packages/
    └── contracts/...     ← Workspace packages compiled too
```

### After (Fixed)
```
dist/
└── main.js  ← Single bundled file (3.4MB)
```

## Verification Commands

### 1. Development Mode (Watch)
```bash
# From root
pnpm dev:api

# Or from apps/api
pnpm dev

# Expected output:
# - Webpack builds successfully
# - API starts on http://localhost:4000
# - File changes trigger rebuild
# - Swagger docs at http://localhost:4000/docs
```

### 2. Build
```bash
# From root
pnpm build:api

# Or from apps/api
pnpm build

# Expected output:
# - Creates dist/main.js
# - No TypeScript errors
# - Webpack bundles successfully
```

### 3. Production Start
```bash
# From root
pnpm build:api && pnpm start:api

# Or from apps/api
pnpm build && pnpm start

# Expected output:
# - API starts on http://localhost:4000
# - All endpoints working
```

### 4. Test Endpoints
```bash
# Health check
curl http://localhost:4000/health
# Response: {"ok":true}

# Version info
curl http://localhost:4000/version
# Response: {"name":"Market API","version":"0.0.1"}

# Swagger docs
open http://localhost:4000/docs
```

## Key Benefits

✅ **Clean separation**: Dev mode uses webpack watch, prod uses bundled output  
✅ **Fast hot reload**: Webpack watch mode detects changes instantly  
✅ **Module compatibility**: Bundles ESM and CommonJS packages correctly  
✅ **Simple output**: Single dist/main.js file  
✅ **Workspace support**: Correctly resolves @workspace/* packages  
✅ **Production ready**: Same webpack config for dev and prod  

## Testing Results

### ✅ Dev Mode
- Webpack compiles successfully
- Watch mode detects file changes
- Hot reload works
- API accessible at http://localhost:4000

### ✅ Build Mode
- Bundles to dist/main.js (3.4MB)
- No TypeScript errors
- Includes all dependencies

### ✅ Start Mode
- Runs bundled output successfully
- Health endpoint: ✓
- Version endpoint: ✓
- Swagger docs: ✓

## Commands Summary

```bash
# Development (from root)
pnpm dev:api              # Start with watch mode

# Build & Start (from root)
pnpm build:api            # Build to dist/main.js
pnpm start:api            # Run production bundle

# Development (from apps/api)
pnpm dev                  # Start with watch mode
pnpm build                # Build to dist/main.js
pnpm start                # Run production bundle

# Database (from root)
pnpm db:generate          # Generate Prisma Client
pnpm db:push              # Push schema to database
```

## Notes

- Webpack bundles all dependencies including workspace packages
- The bundle is larger (3.4MB) but self-contained
- No need for node_modules in production (single file deployment)
- TypeScript paths are resolved at build time by webpack
- Dev mode rebuilds automatically on file changes
