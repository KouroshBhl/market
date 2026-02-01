# UI Component Guidelines

## Design System Enforcement

This project uses a centralized shadcn-based design system to ensure consistency across all apps.

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

## Button Variants

```tsx
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

## Form Pattern

```tsx
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

Avoid adding arbitrary styling classes to components - use their built-in variants instead.

## Cursor AI Prompt Guideline

When working with AI tools like Cursor, always include:

> **Important**: Never use raw `<button>`, `<input>`, `<select>`, or `<textarea>` elements. Always import and use components from `@workspace/ui`.

## Verifying Compliance

Run ESLint to check for violations:

```bash
# Check specific app
pnpm --filter seller lint

# Check all apps
pnpm lint
```

## Exceptions

If you absolutely need a raw element (e.g., for third-party library integration), you can disable the rule for that specific line:

```tsx
{/* eslint-disable-next-line no-restricted-syntax */}
<button ref={thirdPartyLibRef}>Special Button</button>
```

Use this sparingly and document why it's needed.
