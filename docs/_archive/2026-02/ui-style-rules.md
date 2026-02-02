# UI Style Rules - Theme Token Enforcement

## Overview

This monorepo enforces strict UI styling rules to maintain consistency across all applications and ensure proper dark mode support. **Hardcoded Tailwind color utilities are forbidden** in favor of semantic theme tokens from the shared design system.

## Rationale

1. **Theme Consistency**: All apps share the same design system tokens defined in `packages/ui/src/styles/globals.css`
2. **Dark Mode Support**: Theme tokens automatically adapt to dark mode via CSS variables
3. **Maintainability**: Changing colors across the entire platform requires updating only the token definitions
4. **Scalability**: New apps automatically inherit the correct color scheme

## ESLint Rule: `theme-tokens/no-hardcoded-colors`

This custom ESLint rule prevents usage of hardcoded Tailwind color utilities in JSX `className` attributes.

### ❌ Forbidden (Hardcoded Colors)

```tsx
// DO NOT USE - Will cause ESLint errors
<div className="bg-blue-500 text-white" />
<button className="bg-gray-100 text-gray-900 border-gray-300" />
<p className="text-red-600">Error message</p>
<div className="ring-blue-500 border-green-400" />
<Card className="bg-slate-50 border-slate-200" />
```

**Forbidden patterns:**
- `bg-(color)-(shade)` - e.g., `bg-blue-500`, `bg-gray-100`
- `text-(color)-(shade)` - e.g., `text-gray-600`, `text-red-500`
- `border-(color)-(shade)` - e.g., `border-gray-300`, `border-blue-400`
- `ring-(color)-(shade)` - e.g., `ring-blue-500`, `ring-green-400`
- Gradient colors: `from-*`, `via-*`, `to-*`
- Other utilities: `outline-*`, `shadow-*`, `divide-*`, `decoration-*`, `placeholder-*`, `caret-*`

Where `(color)` is any of: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose

### ✅ Allowed (Theme Tokens)

```tsx
// CORRECT - Use semantic theme tokens
<div className="bg-background text-foreground" />
<button className="bg-primary text-primary-foreground border-border" />
<p className="text-destructive">Error message</p>
<div className="ring-ring border-border" />
<Card className="bg-card border-border" />
```

**Available theme tokens:**

| Category | Tokens |
|----------|--------|
| **Background** | `bg-background`, `bg-foreground`, `bg-card`, `bg-popover`, `bg-muted`, `bg-accent` |
| **Text** | `text-foreground`, `text-muted-foreground`, `text-primary-foreground`, `text-secondary-foreground`, `text-accent-foreground`, `text-destructive`, `text-destructive-foreground` |
| **Borders** | `border-border`, `border-input`, `border-ring`, `border-primary`, `border-secondary`, `border-muted`, `border-accent`, `border-destructive` |
| **Rings** | `ring-ring`, `ring-offset-background` |
| **Primary** | `bg-primary`, `text-primary`, `text-primary-foreground` |
| **Secondary** | `bg-secondary`, `text-secondary-foreground` |
| **Destructive** | `bg-destructive`, `text-destructive`, `text-destructive-foreground`, `border-destructive` |
| **Sidebar** | `bg-sidebar`, `bg-sidebar-foreground`, `text-sidebar-foreground` |

See `packages/ui/src/styles/globals.css` for the complete list of available tokens.

## Quick Fix Guide

When ESLint reports a hardcoded color violation, follow these steps:

### 1. Replace with Theme Tokens

```tsx
// Before
<div className="bg-gray-50 text-gray-900">Content</div>

// After
<div className="bg-background text-foreground">Content</div>
```

### 2. Use Component Variants

Instead of custom colors, prefer shadcn component variants:

```tsx
// Before
<button className="bg-blue-500 text-white">Submit</button>

// After - Use Button component with variant
import { Button } from "@workspace/ui"
<Button variant="default">Submit</Button>
```

```tsx
// Before
<div className="bg-red-50 border-red-300 text-red-800">Error</div>

// After - Use Alert component
import { Alert, AlertDescription } from "@workspace/ui"
<Alert variant="destructive">
  <AlertDescription>Error</AlertDescription>
</Alert>
```

```tsx
// Before
<span className="bg-green-100 text-green-800">Active</span>

// After - Use Badge component
import { Badge } from "@workspace/ui"
<Badge variant="success">Active</Badge>
```

### 3. Use Semantic Colors

Map your intent to the appropriate token:

| Intent | Token |
|--------|-------|
| Error / Danger | `text-destructive`, `bg-destructive`, `border-destructive` |
| Success | `text-accent-foreground`, `bg-accent` (or Badge variant) |
| Warning | Use Alert or Badge component |
| Muted / Subtle | `text-muted-foreground`, `bg-muted` |
| Primary action | `bg-primary`, `text-primary-foreground` |
| Card background | `bg-card` |
| Input border | `border-input` |
| Focus ring | `ring-ring` |

## Running the Linter

### Check for violations:

```bash
# Lint entire workspace
pnpm -w lint:ui

# Lint specific app
cd apps/seller
pnpm lint
```

### Auto-fix (where possible):

```bash
pnpm -w lint:ui --fix
```

Note: Most hardcoded color violations require manual refactoring as they involve choosing the appropriate semantic token or component variant.

## Migration Strategy

For existing code with violations:

1. Run `pnpm -w lint:ui` to see all violations
2. Start with high-traffic pages or new features
3. Refactor one page/component at a time
4. Test in both light and dark modes
5. Use the quick fix guide above

## Examples

### Example 1: Status Indicators

```tsx
// ❌ Before
<span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
  Draft
</span>

// ✅ After
import { Badge } from "@workspace/ui"
<Badge variant="warning">Draft</Badge>
```

### Example 2: Error Messages

```tsx
// ❌ Before
<div className="p-4 bg-red-50 border-2 border-red-300 rounded text-red-800">
  {error}
</div>

// ✅ After
import { Alert, AlertDescription } from "@workspace/ui"
<Alert variant="destructive">
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

### Example 3: Card with Custom Colors

```tsx
// ❌ Before
<div className="bg-white border-2 border-gray-300 rounded-lg p-6">
  <h3 className="text-gray-900">Title</h3>
  <p className="text-gray-600">Description</p>
</div>

// ✅ After
import { Card } from "@workspace/ui"
<Card className="p-6 border-2">
  <h3 className="text-foreground">Title</h3>
  <p className="text-muted-foreground">Description</p>
</Card>
```

## Need Help?

- Check the [shadcn/ui documentation](https://ui.shadcn.com/) for component variants
- Review `packages/ui/src/styles/globals.css` for available tokens
- Look at recently refactored pages (e.g., `apps/seller/app/products/new/page.tsx`) for examples
- Ask in the team channel if you're unsure which token to use

## Exceptions

In rare cases where hardcoded colors are truly necessary (e.g., brand-specific colors not in the design system), you can:

1. Add a CSS variable to `packages/ui/src/styles/globals.css`
2. Create a custom theme token
3. Update this documentation with the new token

Do NOT use `eslint-disable` comments to bypass this rule without team discussion.
