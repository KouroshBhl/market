"use client";

import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fa: "فارسی",
  ru: "RU",
  uk: "УКР",
};

/**
 * Language switcher dropdown.
 *
 * Navigates to the same path under the selected locale, preserving
 * the pathname and search params.  Uses a plain `<a>` navigation
 * (not router.push) so the middleware picks up the new locale header.
 */
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  /** Replace the locale segment in the current path. */
  function buildHref(target: Locale): string {
    // pathname is e.g. "/en/p/steam" — replace first segment
    const segments = pathname.split("/");
    segments[1] = target;
    const newPath = segments.join("/");

    // Preserve any search params already on the URL
    const search = typeof window !== "undefined" ? window.location.search : "";
    return `${newPath}${search}`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2"
          aria-label={`Language: ${LOCALE_LABELS[locale]}`}
        >
          <Globe className="size-4" />
          <span className="text-xs font-medium">{LOCALE_LABELS[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {SUPPORTED_LOCALES.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <a
              href={buildHref(l)}
              className={l === locale ? "font-semibold" : undefined}
            >
              {LOCALE_LABELS[l]}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
