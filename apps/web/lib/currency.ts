/**
 * Currency configuration for the buyer web app.
 *
 * - MVP currencies: USD, EUR, TRY, UAH, RUB
 * - Selection persisted in a cookie for SSR access.
 * - No conversion rates yet — only formatting. Conversion is a future task.
 */

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "TRY", "UAH", "RUB"] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "USD";

export const CURRENCY_COOKIE = "preferred_currency";

export const CURRENCY_META: Record<Currency, { symbol: string; label: string }> = {
  USD: { symbol: "$", label: "US Dollar" },
  EUR: { symbol: "€", label: "Euro" },
  TRY: { symbol: "₺", label: "Turkish Lira" },
  UAH: { symbol: "₴", label: "Ukrainian Hryvnia" },
  RUB: { symbol: "₽", label: "Russian Ruble" },
};

export function isValidCurrency(value: string): value is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/*  Cookie helpers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Read the preferred currency from a cookie string (server-side).
 * Pass `document.cookie` on client or the raw cookie header on server.
 */
export function getCurrencyFromCookieString(cookieStr: string): Currency {
  const match = cookieStr.match(
    new RegExp(`(?:^|;\\s*)${CURRENCY_COOKIE}=([^;]*)`)
  );
  const raw = match?.[1];
  return raw && isValidCurrency(raw) ? raw : DEFAULT_CURRENCY;
}

/**
 * Set the preferred currency cookie (client-side only).
 * Max-Age = 1 year, SameSite=Lax, path=/.
 */
export function setCurrencyCookie(currency: Currency): void {
  document.cookie = `${CURRENCY_COOKIE}=${currency};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

/* -------------------------------------------------------------------------- */
/*  Formatting                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Format a monetary amount given in **cents** (integer) for display.
 *
 * Uses `Intl.NumberFormat` for locale-aware digit grouping.
 * No conversion is applied — the amount is assumed to already be in the
 * target currency. Conversion will be added when a rate provider exists.
 *
 * @param amountCents  Integer amount in smallest currency unit.
 * @param currency     ISO 4217 code.
 * @returns Formatted string, e.g. "$19.99", "€18,50".
 */
export function formatMoney(amountCents: number, currency: Currency): string {
  const major = amountCents / 100;
  const meta = CURRENCY_META[currency];

  // Use a neutral locale for grouping; specific locale formatting is a future concern.
  const formatted = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);

  return `${meta.symbol}${formatted}`;
}
