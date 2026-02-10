import Link from "next/link";
import { Separator } from "@workspace/ui";
import { FooterAccordion } from "@/components/footer-accordion";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * Footer columns — all links are real <a> tags for SEO crawlability.
 * Internal paths are locale-agnostic — prefixed at render time.
 *
 * NOTE: The "Browse" column uses a single link to the categories index
 * until a real API provides the category list. No fake category slugs.
 */
const FOOTER_COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "About Us", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      {
        label: "Sell on MarketName",
        href: "https://seller.localhost:3002",
        external: true,
      },
    ],
  },
  {
    title: "Browse",
    links: [{ label: "All Categories", href: "/c" }],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/support" },
      { label: "Contact Us", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Report an Issue", href: "/report" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
] as const;

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Desktop: 4-column grid — hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-4 gap-8 py-12">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold text-sm text-foreground mb-3">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        rel="noopener"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={localePath(locale, link.href)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile: Accordion sections — hidden on desktop */}
        <div className="md:hidden py-6">
          <FooterAccordion columns={FOOTER_COLUMNS} locale={locale} />
        </div>

        <Separator />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MarketName. All rights reserved.
          </p>
          <div
            className="flex items-center gap-3"
            aria-label="Accepted payment methods"
          >
            <PaymentIcon label="Visa" />
            <PaymentIcon label="Mastercard" />
            <PaymentIcon label="PayPal" />
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Payment icon placeholder — small trust symbols                            */
/* -------------------------------------------------------------------------- */

function PaymentIcon({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground"
      aria-label={label}
    >
      {label}
    </span>
  );
}
