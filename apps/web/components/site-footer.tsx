import Link from "next/link";
import { Separator } from "@workspace/ui";
import { FooterAccordion } from "@/components/footer-accordion";
import { localePath, type Locale } from "@/lib/i18n";
import type { NavParentCategory } from "@/lib/api";

/**
 * Static footer columns — links that never change.
 * The "Browse" column is built dynamically from real category data.
 */
const MARKETPLACE_COLUMN = {
  title: "Marketplace",
  links: [
    { label: "About Us", href: "/about" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Sell on MarketName", href: "https://seller.localhost:3002", external: true },
  ],
};

const SUPPORT_COLUMN = {
  title: "Support",
  links: [
    { label: "Help Center", href: "/support" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Report an Issue", href: "/report" },
  ],
};

const LEGAL_COLUMN = {
  title: "Legal",
  links: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ],
};

interface SiteFooterProps {
  locale: Locale;
  categories: NavParentCategory[];
}

export function SiteFooter({ locale, categories }: SiteFooterProps) {
  // Build the Browse column from real DB categories
  const browseLinks =
    categories.length > 0
      ? categories.map((c) => ({ label: c.name, href: `/c/${c.slug}` }))
      : [{ label: "All Categories", href: "/c" }];

  const allColumns = [
    MARKETPLACE_COLUMN,
    { title: "Browse", links: browseLinks },
    SUPPORT_COLUMN,
    LEGAL_COLUMN,
  ];

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Desktop: 4-column grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-8 py-12">
          {allColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold text-sm text-foreground mb-3">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link &&
                    (link as { external?: boolean }).external ? (
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

        {/* Mobile: Accordion sections */}
        <div className="md:hidden py-6">
          <FooterAccordion columns={allColumns} locale={locale} />
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
