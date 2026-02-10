import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { Button, Input } from "@workspace/ui";
import { MobileMenu } from "@/components/mobile-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { localePath, type Locale } from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        {/* Mobile menu trigger — only visible on small screens */}
        <div className="md:hidden">
          <MobileMenu locale={locale} />
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

        {/* Desktop: Categories link (placeholder until API wired) */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-1"
        >
          <Button variant="ghost" size="sm" asChild>
            <Link href={localePath(locale, "/c")}>Categories</Link>
          </Button>
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
          {/* Language + Currency — hidden on small screens (available in mobile menu) */}
          <div className="hidden md:flex items-center gap-0.5">
            <LanguageSwitcher locale={locale} />
            <CurrencySwitcher />
          </div>

          {/* Mobile search icon */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search"
          >
            <Search className="size-5" />
          </Button>

          {/* Account / Sign in */}
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

          {/* Cart */}
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
