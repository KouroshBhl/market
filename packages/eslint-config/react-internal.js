import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

import { config as baseConfig } from "./base.js"

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config} */
export const config = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  {
    files: ["**/*.tsx", "**/*.jsx"],
    ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: 'JSXOpeningElement[name.name="button"]',
          message: 'Use <Button> from @workspace/ui instead of raw <button> elements. Import: import { Button } from "@workspace/ui"',
        },
        {
          selector: 'JSXOpeningElement[name.name="input"]',
          message: 'Use <Input> from @workspace/ui instead of raw <input> elements. Import: import { Input } from "@workspace/ui"',
        },
        {
          selector: 'JSXOpeningElement[name.name="select"]',
          message: 'Use <Select> from @workspace/ui instead of raw <select> elements. Import: import { Select } from "@workspace/ui"',
        },
        {
          selector: 'JSXOpeningElement[name.name="textarea"]',
          message: 'Use <Textarea> from @workspace/ui instead of raw <textarea> elements. Import: import { Textarea} from "@workspace/ui"',
        },
      ],
    },
  },
]
