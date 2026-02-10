"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, User, Globe } from "lucide-react";
import {
  Button,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Separator,
} from "@workspace/ui";
import { localePath, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_META,
  DEFAULT_CURRENCY,
  getCurrencyFromCookieString,
  setCurrencyCookie,
  type Currency,
} from "@/lib/currency";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fa: "فارسی",
  ru: "RU",
  uk: "УКР",
};

export function MobileMenu({ locale }: { locale: Locale }) {
  const [open, setOpen] = React.useState(false);
  const [currency, setCurrency] = React.useState<Currency>(DEFAULT_CURRENCY);

  React.useEffect(() => {
    setCurrency(getCurrencyFromCookieString(document.cookie));
  }, []);

  function handleCurrencySelect(next: Currency) {
    setCurrency(next);
    setCurrencyCookie(next);
  }

  /** Build locale-switch href preserving current path. */
  function localeHref(target: Locale): string {
    if (typeof window === "undefined") return `/${target}`;
    const segments = window.location.pathname.split("/");
    segments[1] = target;
    return `${segments.join("/")}${window.location.search}`;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 overflow-y-auto">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-lg">Menu</SheetTitle>
        </SheetHeader>

        <nav aria-label="Mobile navigation" className="flex flex-col">
          {/* Browse placeholder — until categories are wired to API */}
          <div className="px-2 py-2">
            <Button
              variant="ghost"
              className="w-full justify-start font-medium text-sm px-3"
              asChild
            >
              <Link
                href={localePath(locale, "/c")}
                onClick={() => setOpen(false)}
              >
                Browse Categories
              </Link>
            </Button>
          </div>

          <Separator className="my-2" />

          {/* Account & support links */}
          <div className="px-2 py-2 flex flex-col gap-0.5">
            <Link
              href={localePath(locale, "/auth/login")}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <User className="size-4" />
              Sign In
            </Link>
            <Link
              href={localePath(locale, "/support")}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Help &amp; Support
            </Link>
          </div>

          <Separator className="my-2" />

          {/* Language selector */}
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Globe className="size-3.5" />
              Language
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_LOCALES.map((l) => (
                <Button
                  key={l}
                  variant={l === locale ? "secondary" : "outline"}
                  size="sm"
                  asChild
                  className="text-xs"
                >
                  <a href={localeHref(l)} onClick={() => setOpen(false)}>
                    {LOCALE_LABELS[l]}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Currency selector */}
          <div className="px-4 py-2 pb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Currency
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_CURRENCIES.map((c) => (
                <Button
                  key={c}
                  variant={c === currency ? "secondary" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => handleCurrencySelect(c)}
                >
                  {CURRENCY_META[c].symbol} {c}
                </Button>
              ))}
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
