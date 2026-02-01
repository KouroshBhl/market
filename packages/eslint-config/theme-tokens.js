import noHardcodedColorsRule from "./no-hardcoded-colors.js"

/**
 * ESLint configuration to enforce theme token usage.
 * Prevents hardcoded Tailwind color classes in favor of design system tokens.
 *
 * @type {import("eslint").Linter.Config}
 */
export const themeTokensConfig = {
  plugins: {
    "theme-tokens": {
      rules: {
        "no-hardcoded-colors": noHardcodedColorsRule,
      },
    },
  },
  rules: {
    "theme-tokens/no-hardcoded-colors": "error",
  },
}
