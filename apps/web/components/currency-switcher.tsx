"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_META,
  DEFAULT_CURRENCY,
  getCurrencyFromCookieString,
  setCurrencyCookie,
  type Currency,
} from "@/lib/currency";

/**
 * Currency switcher dropdown.
 *
 * Reads the initial value from the cookie (client-side `document.cookie`).
 * On selection, writes the cookie and refreshes the router so server
 * components that read the cookie pick up the new value.
 */
export function CurrencySwitcher() {
  const router = useRouter();
  const [currency, setCurrency] = React.useState<Currency>(DEFAULT_CURRENCY);

  // Hydrate from cookie on mount
  React.useEffect(() => {
    setCurrency(getCurrencyFromCookieString(document.cookie));
  }, []);

  function handleSelect(next: Currency) {
    setCurrency(next);
    setCurrencyCookie(next);
    // Refresh so server components re-read the cookie
    router.refresh();
  }

  const meta = CURRENCY_META[currency];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2"
          aria-label={`Currency: ${currency}`}
        >
          <span className="text-xs font-medium">
            {meta.symbol} {currency}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {SUPPORTED_CURRENCIES.map((c) => {
          const m = CURRENCY_META[c];
          return (
            <DropdownMenuItem
              key={c}
              onSelect={() => handleSelect(c)}
              className={c === currency ? "font-semibold" : undefined}
            >
              <span className="mr-2 inline-block w-4 text-center">
                {m.symbol}
              </span>
              {c}
              <span className="ml-auto text-muted-foreground text-xs">
                {m.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
