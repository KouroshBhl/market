# FRONTEND SYSTEM

Single source of truth for design system, UI components, styling rules, and frontend conventions.

---

## Component Rules (STRICT)

### Always Import from @workspace/ui
```typescript
import { Button, Input, Select, Textarea, Label, Card, Badge, Alert } from '@workspace/ui';
```

### FORBIDDEN Raw Elements
ESLint will error on these in app code:
- `<button>` → Use `<Button>`
- `<input>` → Use `<Input>`
- `<select>` → Use `<Select>`
- `<textarea>` → Use `<Textarea>`

### FORBIDDEN Deep Imports
```typescript
// ❌ WRONG
import { Button } from '@workspace/ui/components/button';

// ✅ CORRECT
import { Button } from '@workspace/ui';
```

---

## Theme Token Rules (STRICT)

### FORBIDDEN: Hardcoded Tailwind Colors

ESLint rule `no-hardcoded-colors` blocks these patterns:
```
bg-(color)-(shade)      e.g., bg-blue-500, bg-gray-100
text-(color)-(shade)    e.g., text-red-600, text-gray-900
border-(color)-(shade)  e.g., border-green-300
ring-(color)-(shade)    e.g., ring-blue-500
from-*, via-*, to-*     gradients
```

Colors blocked: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose

### ALLOWED: Semantic Theme Tokens

| Category | Tokens |
|----------|--------|
| **Backgrounds** | `bg-background`, `bg-card`, `bg-muted`, `bg-accent`, `bg-primary`, `bg-secondary`, `bg-destructive` |
| **Text** | `text-foreground`, `text-muted-foreground`, `text-primary-foreground`, `text-accent-foreground`, `text-destructive`, `text-destructive-foreground` |
| **Borders** | `border-border`, `border-input`, `border-ring`, `border-primary`, `border-destructive` |
| **Rings** | `ring-ring`, `ring-offset-background` |

### Migration Examples

```tsx
// ❌ Before
<div className="bg-gray-50 text-gray-900">
<p className="text-gray-600">
<button className="bg-blue-500 text-white">
<div className="bg-red-50 border-red-300 text-red-800">

// ✅ After
<div className="bg-background text-foreground">
<p className="text-muted-foreground">
<Button>  // uses primary by default
<Alert variant="destructive">
```

---

## Component Variants

### Button
```tsx
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="link">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Badge
```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
```

### Alert
```tsx
<Alert>Default info alert</Alert>
<Alert variant="destructive">
  <AlertDescription>Error message</AlertDescription>
</Alert>
```

---

## Form Patterns

### Standard Form Field
```tsx
import { Button, Input, Label } from '@workspace/ui';

<div className="space-y-2">
  <Label htmlFor="email">Email *</Label>
  <Input
    id="email"
    type="email"
    required
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Enter email"
  />
</div>
```

### Card Container
```tsx
import { Card } from '@workspace/ui';

<Card className="p-6 border-2">
  <h3 className="text-foreground">Title</h3>
  <p className="text-muted-foreground">Description</p>
</Card>
```

---

## Layout Classes (Allowed)

These non-color utilities are fine on any element:
- Spacing: `p-4`, `m-2`, `mt-4`, `mb-2`, `space-y-4`, `gap-2`
- Size: `w-full`, `h-full`, `max-w-md`
- Layout: `flex`, `grid`, `items-center`, `justify-between`
- Typography: `font-bold`, `text-sm`, `text-lg`
- Borders: `rounded-lg`, `border-2` (without color)

---

## State Patterns

### Loading State
```tsx
{isLoading && <Spinner />}
```

### Error State
```tsx
<Alert variant="destructive">
  <AlertDescription>{error.message}</AlertDescription>
  <Button variant="outline" onClick={retry}>Retry</Button>
</Alert>
```

### Empty State
```tsx
<div className="text-center text-muted-foreground py-8">
  No items found
</div>
```

---

## React Query Setup

### Provider Location
- Place `QueryProvider` in dashboard layout, not root
- Avoid provider in every page

### Query Keys
```typescript
// Stable, predictable keys
['products']
['product', productId]
['offers', { sellerId }]
```

### Mutations
```typescript
// Always invalidate related queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['products'] });
}
```

---

## TanStack Table Conventions

### Column Definitions
- Separate file: `*.columns.tsx`
- Keep table state separate from server state
- MVP: Client-side only (server-side later if needed)

```tsx
// products.columns.tsx
export const columns: ColumnDef<Product>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'status', cell: ({ row }) => <Badge>{row.getValue('status')}</Badge> },
];
```

---

## Accessibility Requirements

- Interactive elements MUST be keyboard accessible
- Use proper ARIA roles when applicable
- **FORBIDDEN**: `<div role="button">` — use real `<Button>`
- Use `<Label htmlFor={id}>` with form inputs
- Focus management for modals and dialogs

---

## Dark Mode Strategy

### Current State
- Theme tokens defined in `packages/ui/src/styles/globals.css`
- Light mode implemented
- Dark mode ready (CSS variables switch automatically)

### Implementation
- All components use CSS variables (not hardcoded colors)
- Theme tokens work in both modes
- No additional work needed when dark mode is enabled

---

## Adding New Components

### From shadcn
```bash
pnpm dlx shadcn@latest add <component-name> -c apps/seller
# Components auto-placed in packages/ui/src/components/
```

### Export from Package
```typescript
// packages/ui/src/index.ts
export { NewComponent } from './components/new-component';
```

### Usage
```typescript
import { NewComponent } from '@workspace/ui';
```

---

## ESLint Rules Summary

| Rule | Purpose |
|------|---------|
| `no-hardcoded-colors` | Prevents hardcoded Tailwind color classes |
| `no-restricted-syntax` | Prevents raw `<button>`, `<input>`, etc. |

### Check Compliance
```bash
# Check specific app
pnpm --filter seller lint

# Check all apps for UI violations
pnpm -w lint:ui
```

---

## Available Components

From `@workspace/ui`:

| Component | Usage |
|-----------|-------|
| Button | Buttons with variants |
| Input | Text, number, email, password |
| Select | Dropdown selects |
| Textarea | Multi-line text |
| Label | Form labels |
| Card | Container cards |
| Badge | Status badges |
| Alert | Alert messages |
| Dialog | Modal dialogs |
| Switch | Toggle switches |
| Table | Data tables |
| Toast | Notifications |

---

## Quick Reference

### DO
- Import all UI from `@workspace/ui`
- Use semantic tokens (`bg-background`, `text-foreground`)
- Use component variants over custom classes
- Provide loading, error, and empty states
- Make interactive elements keyboard accessible

### DO NOT
- Use raw HTML form elements in apps
- Use hardcoded Tailwind colors
- Deep import from UI package internals
- Skip loading/error states
- Use `<div role="button">`
