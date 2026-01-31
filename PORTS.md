# Port Configuration Quick Reference

## Port Assignments

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Frontend Apps (3000-3002)                      │
│  ├─ web:    http://localhost:3000              │
│  ├─ admin:  http://localhost:3001              │
│  └─ seller: http://localhost:3002              │
│                                                 │
│  Backend API (4000)                             │
│  └─ api:    http://localhost:4000              │
│     └─ docs: http://localhost:4000/docs        │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Usage

### Start All Apps
```bash
pnpm dev
```

### Start Individual Apps
```bash
pnpm dev:web      # → http://localhost:3000
pnpm dev:admin    # → http://localhost:3001
pnpm dev:seller   # → http://localhost:3002
pnpm dev:api      # → http://localhost:4000
```

## Configuration Files

### API Port Configuration

**apps/api/.env**
```env
PORT=4000
```

**apps/api/src/main.ts**
```typescript
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
```

### Next.js Port Configuration

**apps/web/package.json**
```json
"dev": "next dev -p 3000 --turbopack"
```

**apps/admin/package.json**
```json
"dev": "next dev -p 3001 --turbopack"
```

**apps/seller/package.json**
```json
"dev": "next dev -p 3002 --turbopack"
```

## CORS Configuration

The API is configured to accept requests from all frontend apps:

**apps/api/.env**
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

## Verification

```bash
# Test API endpoints
curl http://localhost:4000/health   # {"ok":true}
curl http://localhost:4000/version  # {"name":"Market API","version":"0.0.1"}

# Open Swagger docs
open http://localhost:4000/docs
```

## Benefits

✅ No port conflicts  
✅ Clear frontend/backend separation  
✅ Easy to remember  
✅ All apps can run simultaneously  
✅ Proper CORS configuration  

---

See **PORT_STANDARDIZATION.md** for detailed information.
