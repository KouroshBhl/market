# Documentation

**5 canonical files. No duplicates. AI-ready.**

---

## Quick Links

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Monorepo structure, API design, database philosophy, ports |
| [PRODUCT_DOMAIN.md](./PRODUCT_DOMAIN.md) | Catalog, categories, offers, delivery types, wizard flow |
| [FRONTEND_SYSTEM.md](./FRONTEND_SYSTEM.md) | UI components, theme tokens, styling rules, React patterns |
| [BACKEND_RULES.md](./BACKEND_RULES.md) | API conventions, validation, Prisma rules, security |
| [WORKFLOWS.md](./WORKFLOWS.md) | Setup, development, testing, troubleshooting |

---

## For AI Tools (Cursor, Copilot)

These files contain explicit DO/DO NOT rules. When generating code:

1. **UI Code** → Read [FRONTEND_SYSTEM.md](./FRONTEND_SYSTEM.md)
   - Use `@workspace/ui` components, not raw elements
   - Use semantic tokens, not hardcoded colors

2. **API Code** → Read [BACKEND_RULES.md](./BACKEND_RULES.md)
   - Use Zod validation, not class-validator
   - Store money as Int (cents), not Float

3. **Database Changes** → Read [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Use snake_case in DB, camelCase in Prisma
   - Return dates as ISO strings

4. **Product Features** → Read [PRODUCT_DOMAIN.md](./PRODUCT_DOMAIN.md)
   - 2-level categories only
   - No DB writes until Save/Publish

---

## Archive

Historical implementation notes are in `_archive/YYYY-MM/`. These are kept for audit trail only and should not be used as source of truth.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turbo |
| Frontend | Next.js 15, React 19, TailwindCSS 4 |
| Backend | NestJS, Webpack |
| Database | Prisma, PostgreSQL |
| Validation | Zod |
| API Docs | Swagger/OpenAPI |

---

## Ports

| App | Port |
|-----|------|
| web | 3000 |
| admin | 3001 |
| seller | 3002 |
| api | 4000 |
| Swagger | 4000/docs |
