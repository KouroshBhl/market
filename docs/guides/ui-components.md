# UI Component Guidelines

## Overview

This project uses a centralized shadcn-based design system to ensure consistency across all Next.js apps.

## Component Usage

### ✅ ALWAYS Use Shared Components

Import UI components from `@workspace/ui`:

```typescript
import { Button, Input, Select, Textarea, Label, Card } from '@workspace/ui';
```

### ❌ NEVER Use Raw HTML Elements

The following raw elements are **prohibited** in app code:

- `<button>` → Use `<Button>` instead
- `<input>` → Use `<Input>` instead
- `<select>` → Use `<Select>` instead
- `<textarea>` → Use `<Textarea>` instead

**ESLint will error** if you use raw form elements in `.tsx` files.

## Examples

### ❌ Bad (will fail ESLint)

```tsx
function MyForm() {
  return (
    <form>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        className="border rounded px-3 py-2"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### ✅ Good (ESLint compliant)

```tsx
import { Button, Input, Label } from '@workspace/ui';

function MyForm() {
  return (
    <form>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

## Available Components

From `@workspace/ui`:

- `Button` - Buttons with variants (default, destructive, outline, secondary, ghost, link)
- `Input` - Text, number, email, password inputs
- `Select` - Dropdown selects
- `Textarea` - Multi-line text areas
- `Label` - Form labels
- `Card` - Container cards
- `Badge` - Status badges
- `Alert` - Alert messages
- `Dialog` - Modal dialogs
- `Switch` - Toggle switches
- `Toast` - Toast notifications

## Theme Tokens

### ❌ NEVER Use Hardcoded Colors

```tsx
// ❌ Bad - hardcoded colors
<div className="bg-blue-500 text-white border-gray-300">
  Content
</div>
```

### ✅ ALWAYS Use Semantic Tokens

```tsx
// ✅ Good - semantic tokens
<div className="bg-background text-foreground border-border">
  Content
</div>
```

### Allowed Semantic Tokens

**Backgrounds:**
- `bg-background` - Main background
- `bg-card` - Card backgrounds
- `bg-accent` - Accent backgrounds
- `bg-muted` - Muted backgrounds
- `bg-destructive` - Destructive actions

**Text:**
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `text-accent-foreground` - Accent text
- `text-destructive-foreground` - Error text

**Borders:**
- `border-border` - Standard borders
- `ring-ring` - Focus rings

## Button Variants

```tsx
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="secondary">Secondary</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

## Form Pattern

```tsx
import { Button, Input, Label } from '@workspace/ui';

<div className="space-y-2">
  <Label htmlFor="field">Field Name *</Label>
  <Input
    id="field"
    type="text"
    required
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Enter value"
  />
</div>
```

## Layout Classes

Small layout utilities are allowed on wrappers:

- `w-full`, `h-full`
- `flex`, `grid`, `space-y-4`, `gap-2`
- `p-4`, `m-2`, `mt-4`, `mb-2`

**Avoid adding arbitrary styling classes to components** - use their built-in variants instead.

## Verifying Compliance

Run ESLint to check for violations:

```bash
# Check specific app
pnpm --filter seller lint

# Check all apps
pnpm lint
```

## Exceptions

If you absolutely need a raw element (e.g., for third-party library integration), disable the rule for that specific line:

```tsx
{/* eslint-disable-next-line no-restricted-syntax */}
<button ref={thirdPartyLibRef}>Special Button</button>
```

Use this sparingly and document why it's needed.

## ESLint Rules

The following ESLint rules enforce these guidelines:

1. **no-hardcoded-colors** - Prevents hardcoded Tailwind color classes
2. **react-internal-no-raw-elements** - Prevents raw form elements in app code

These rules are defined in `packages/eslint-config/`.

## Adding New Components

To add a new shadcn component:

```bash
# From the root of the monorepo
pnpm dlx shadcn@latest add <component-name> -c apps/seller

# This automatically places components in packages/ui/src/components/
```

Then export from `packages/ui/src/index.ts`:

```typescript
export { ComponentName } from './components/component-name';
```

## Component Variants

Prefer using component variants over custom classes:

```tsx
// ❌ Bad
<Badge className="bg-green-500">Success</Badge>

// ✅ Good
<Badge variant="success">Success</Badge>
```

## Accessibility

All UI components from `@workspace/ui` are built with accessibility in mind:

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader support

When composing custom components, ensure:

- Interactive elements are keyboard accessible
- Use proper roles and ARIA attributes
- Avoid `<div role="button">` - use real `<Button>` components
