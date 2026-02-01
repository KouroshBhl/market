# `@workspace/eslint-config`

Shared ESLint configuration for the workspace.

## Available Configs

### `@workspace/eslint-config/base`

Base configuration for all TypeScript projects:
- TypeScript ESLint
- Prettier integration
- Turbo plugin

```js
import { config } from "@workspace/eslint-config/base"

export default [...config]
```

### `@workspace/eslint-config/next-js`

Configuration for Next.js applications (includes base + theme-tokens):
- All base rules
- React and React Hooks
- Next.js plugin
- **Theme token enforcement** (no hardcoded colors)

```js
import { nextJsConfig } from "@workspace/eslint-config/next-js"

export default [...nextJsConfig]
```

### `@workspace/eslint-config/theme-tokens`

Standalone theme token enforcement (prevents hardcoded Tailwind colors):

```js
import { themeTokensConfig } from "@workspace/eslint-config/theme-tokens"

export default [themeTokensConfig]
```

## Custom Rules

### `theme-tokens/no-hardcoded-colors`

Prevents hardcoded Tailwind color utilities in JSX `className` attributes.

**Forbidden:**
- `bg-blue-500`, `text-gray-600`, `border-red-300`, `ring-green-400`
- Any color from Tailwind's default palette

**Allowed:**
- Theme tokens: `bg-background`, `text-foreground`, `border-border`, `ring-ring`
- Non-color utilities: `px-4`, `rounded-lg`, `font-bold`, etc.

See `/docs/ui-style-rules.md` for detailed documentation and examples.
