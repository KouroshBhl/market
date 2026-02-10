/**
 * i18n configuration for the buyer web app.
 *
 * - URL-based locale routing: /en/..., /fa/..., /ru/..., /uk/...
 * - Content translation is NOT active yet — all locales fallback to English.
 * - RTL only for `fa`.
 */

export const SUPPORTED_LOCALES = ["en", "fa", "ru", "uk"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

const RTL_LOCALES: readonly Locale[] = ["fa"];

export function isValidLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

/**
 * Prefix a path with the current locale segment.
 *
 * @example localePath("en", "/c/games") → "/en/c/games"
 * @example localePath("fa", "/")        → "/fa"
 */
export function localePath(locale: Locale, path: string): string {
  if (path === "/" || path === "") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Generate `alternates` metadata (canonical + hreflang) for a page.
 *
 * @param locale  Current page locale.
 * @param pagePath  Path after the locale segment (e.g. "" for home, "/p/slug" for product).
 */
export function generateLocaleAlternates(locale: Locale, pagePath: string = "") {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    canonical: `${baseUrl}/${locale}${pagePath}`,
    languages: {
      ...Object.fromEntries(
        SUPPORTED_LOCALES.map((l) => [l, `${baseUrl}/${l}${pagePath}`])
      ),
      "x-default": `${baseUrl}/${DEFAULT_LOCALE}${pagePath}`,
    },
  };
}
