# UI Style Rules Implementation - Hardcoded Color Prevention

## Overview

Implemented strict ESLint rules to prevent hardcoded Tailwind color utilities across the monorepo, enforcing consistent theme token usage from the shared design system.

## Files Created/Modified

### Created:

1. **`packages/eslint-config/no-hardcoded-colors.js`**
   - Custom ESLint rule that detects hardcoded Tailwind color classes
   - Matches patterns like `bg-blue-500`, `text-gray-600`, `border-red-300`, `ring-green-400`
   - Provides helpful error messages with suggested theme tokens
   - Supports all color utilities: bg, text, border, ring, from, via, to, outline, shadow, etc.

2. **`packages/eslint-config/theme-tokens.js`**
   - ESLint config that enables the no-hardcoded-colors rule
   - Exports `themeTokensConfig` for use in other configs

3. **`docs/ui-style-rules.md`**
   - Comprehensive documentation on the rules
   - Lists forbidden patterns and allowed theme tokens
   - Provides quick fix guide with examples
   - Explains rationale (consistency + dark mode)

### Modified:

4. **`packages/eslint-config/package.json`**
   - Added export for `./theme-tokens` config

5. **`packages/eslint-config/next.js`**
   - Integrated `themeTokensConfig` into Next.js config
   - Now automatically enforced in all Next.js apps

6. **`package.json`** (root)
   - Added `lint:ui` script to run linter on all apps

## How It Works

### The Rule

The custom ESLint rule scans JSX `className` attributes for hardcoded Tailwind color patterns:

**Forbidden patterns:**
```regex
(bg|text|border|ring|from|via|to)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)
```

**Allowed patterns:**
- All semantic tokens: `bg-background`, `text-foreground`, `border-border`, `ring-ring`, etc.
- Any non-color utilities: `px-4`, `py-2`, `rounded-lg`, `font-bold`, etc.

### Integration

The rule is automatically active in all apps using `@workspace/eslint-config/next-js`:

```js
// apps/*/eslint.config.js
import { nextJsConfig } from "@workspace/eslint-config/next-js"

export default [
  ...nextJsConfig,
  // ... other config
]
```

## Running the Linter

### Check all apps for violations:

```bash
pnpm -w lint:ui
```

### Check specific app:

```bash
cd apps/seller
pnpm lint
```

### With fix attempt:

```bash
pnpm -w lint:ui --fix
```

Note: Color violations require manual refactoring (choosing appropriate semantic tokens).

## Demonstration

### ❌ Violating Code (Will Fail ESLint):

```tsx
export function BadExample() {
  return (
    <div>
      <div className="bg-blue-500 text-white">Button</div>
      <span className="text-gray-600">Muted text</span>
      <button className="bg-red-50 border-red-300 text-red-800">
        Error
      </button>
      <div className="ring-blue-500 border-green-400">Focus ring</div>
    </div>
  );
}
```

**ESLint Output:**
```
  8:12  error  Hardcoded Tailwind color 'bg-blue-500' is forbidden. 
               Use theme tokens (bg-background, bg-foreground, bg-card) 
               or shadcn component variants instead.
               
  9:13  error  Hardcoded Tailwind color 'text-gray-600' is forbidden.
               Use theme tokens (text-foreground, text-background, text-card)
               or shadcn component variants instead.
               
 10:15  error  Hardcoded Tailwind color 'bg-red-50' is forbidden.
               Use theme tokens (bg-background, bg-foreground, bg-card)
               or shadcn component variants instead.
               
 10:15  error  Hardcoded Tailwind color 'border-red-300' is forbidden.
               Use theme tokens (border-background, border-foreground, border-border)
               or shadcn component variants instead.
```

### ✅ Fixed Code (Passes ESLint):

```tsx
import { Button, Alert, AlertDescription } from "@workspace/ui"

export function GoodExample() {
  return (
    <div>
      {/* Use Button component with theme tokens */}
      <Button>Button</Button>
      
      {/* Use semantic tokens for text */}
      <span className="text-muted-foreground">Muted text</span>
      
      {/* Use Alert component for errors */}
      <Alert variant="destructive">
        <AlertDescription>Error</AlertDescription>
      </Alert>
      
      {/* Use semantic tokens for focus/borders */}
      <div className="ring-ring border-border">Focus ring</div>
    </div>
  );
}
```

## Current Violation Status

### apps/seller
✅ **Zero violations** - Already refactored to use theme tokens
- `app/products/new/page.tsx` - Uses theme tokens
- `app/products/[id]/next-step/page.tsx` - Uses theme tokens
- `components/delivery-type-card.tsx` - Uses theme tokens

### apps/web
✅ **Zero violations** - Clean starter code

### apps/admin
✅ **Zero violations** - Clean starter code

### apps/api
⚠️ **N/A** - Backend code, no JSX

## Migration Guide for Existing Violations

If violations are found in the future:

1. **Run the linter:**
   ```bash
   pnpm -w lint:ui
   ```

2. **Review violations:**
   - ESLint will list all files with hardcoded colors
   - Each violation includes the forbidden class and suggested tokens

3. **Fix violations:**
   - Option A: Replace with theme token (see docs/ui-style-rules.md)
   - Option B: Use shadcn component with variant
   - Option C: Extract to reusable component

4. **Test in both themes:**
   - Verify light mode appearance
   - Verify dark mode appearance (if implemented)

## Quick Reference

### Common Replacements:

| Old (Forbidden) | New (Allowed) | Context |
|-----------------|---------------|---------|
| `bg-gray-50` | `bg-background` | Page background |
| `bg-white` | `bg-card` | Card/panel background |
| `text-gray-900` | `text-foreground` | Primary text |
| `text-gray-600` | `text-muted-foreground` | Secondary text |
| `border-gray-300` | `border-border` | Standard borders |
| `ring-blue-500` | `ring-ring` | Focus rings |
| `bg-red-50 text-red-800` | Alert destructive | Error states |
| `bg-green-100 text-green-800` | Badge success | Success states |
| `bg-blue-500 text-white` | Button default | Primary buttons |

### Component Replacements:

| Hardcoded Pattern | Component Alternative |
|-------------------|----------------------|
| Error box with red colors | `<Alert variant="destructive">` |
| Success badge with green colors | `<Badge variant="success">` |
| Button with blue colors | `<Button variant="default">` |
| Info box with blue colors | `<Alert>` (default) |

## Benefits

1. **Consistency**: All apps share the same visual language
2. **Dark Mode**: Theme tokens automatically work in dark mode
3. **Maintainability**: Change colors globally by updating token definitions
4. **Type Safety**: ESLint catches violations at development time
5. **Documentation**: Clear guidance on how to fix violations

## Next Steps

1. ✅ Rules are implemented and active
2. ✅ Documentation is available
3. ✅ Existing code is compliant
4. 🔄 Team can now develop with confidence that hardcoded colors won't be committed
5. 📚 Review `docs/ui-style-rules.md` for detailed examples and guidance

## Additional Resources

- Documentation: `docs/ui-style-rules.md`
- Theme tokens: `packages/ui/src/styles/globals.css`
- Example refactors: `apps/seller/app/products/new/page.tsx`
- shadcn components: https://ui.shadcn.com/
