import Link from "next/link";
import { Search, ShoppingCart, User, ChevronDown } from "lucide-react";
import { Button, Input } from "@workspace/ui";
import { MobileMenu } from "@/components/mobile-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { localePath, type Locale } from "@/lib/i18n";
import type { NavParentCategory } from "@/lib/api";

interface SiteHeaderProps {
  locale: Locale;
  categories: NavParentCategory[];
}

export function SiteHeader({ locale, categories }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        {/* Mobile menu trigger — only visible on small screens */}
        <div className="md:hidden">
          <MobileMenu locale={locale} categories={categories} />
        </div>

        {/* Logo */}
        <Link
          href={localePath(locale, "/")}
          className="flex items-center gap-2 font-bold text-lg text-foreground shrink-0"
        >
          <span className="sr-only">MarketName home</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="size-6 text-primary"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="3"
              className="fill-primary"
            />
            <path
              d="M8 12l3 3 5-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-foreground"
            />
          </svg>
          <span className="hidden sm:inline">MarketName</span>
        </Link>

        {/* Desktop: Categories mega-menu */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-1"
        >
          {categories.length > 0 ? (
            <DesktopCategoryNav categories={categories} locale={locale} />
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href={localePath(locale, "/c")}>Categories</Link>
            </Button>
          )}
        </nav>

        {/* Search bar — desktop only, UI shell only */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-9 w-full"
              aria-label="Search products"
            />
          </div>
        </div>

        {/* Right side: switchers, search (mobile), account, cart */}
        <div className="flex items-center gap-0.5 ml-auto">
          <div className="hidden md:flex items-center gap-0.5">
            <LanguageSwitcher locale={locale} />
            <CurrencySwitcher />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search"
          >
            <Search className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:flex"
          >
            <Link
              href={localePath(locale, "/auth/login")}
              aria-label="Sign in"
            >
              <User className="size-5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link
              href={localePath(locale, "/cart")}
              aria-label="Shopping cart"
            >
              <ShoppingCart className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Desktop category mega-menu — server-rendered for SEO                      */
/*  All links are real crawlable <a> tags.                                    */
/* -------------------------------------------------------------------------- */

function DesktopCategoryNav({
  categories,
  locale,
}: {
  categories: NavParentCategory[];
  locale: Locale;
}) {
  // 3-column grid works well up to ~6 parents; beyond that, still okay with scroll
  const cols = categories.length <= 3 ? categories.length : 3;

  return (
    <div className="group relative">
      <Button variant="ghost" size="sm" className="gap-1.5">
        Categories
        <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
      </Button>

      {/* Mega-menu: visible on group hover / focus-within for progressive enhancement.
          All links are real <a> tags — fully crawlable by search engines. */}
      <div
        className="invisible group-hover:visible group-focus-within:visible absolute left-0 top-full pt-2 z-50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-150"
        role="menu"
      >
        <div className="rounded-lg border border-border bg-background p-6 shadow-lg min-w-[480px]">
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {categories.map((parent) => (
              <div key={parent.id}>
                <Link
                  href={localePath(locale, `/c/${parent.slug}`)}
                  className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
                  role="menuitem"
                >
                  {parent.name}
                </Link>
                {parent.children.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {parent.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={localePath(
                            locale,
                            `/c/${parent.slug}/${child.slug}`,
                          )}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          role="menuitem"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
