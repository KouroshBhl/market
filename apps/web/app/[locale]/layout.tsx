import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  SUPPORTED_LOCALES,
  isValidLocale,
  generateLocaleAlternates,
  type Locale,
} from "@/lib/i18n";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const SITE_NAME = "MarketName";
const SITE_DESCRIPTION =
  "Buy digital products from trusted sellers. Game keys, software licenses, gift cards, and more — instant delivery available.";

/* -------------------------------------------------------------------------- */
/*  Static params — tells Next.js which locale values are valid               */
/* -------------------------------------------------------------------------- */

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/* -------------------------------------------------------------------------- */
/*  Locale-aware metadata + hreflang                                          */
/* -------------------------------------------------------------------------- */

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "en";

  const alternates = generateLocaleAlternates(locale);

  return {
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    alternates,
    openGraph: {
      type: "website",
      locale: locale === "fa" ? "fa_IR" : locale === "ru" ? "ru_RU" : locale === "uk" ? "uk_UA" : "en_US",
      siteName: SITE_NAME,
      title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
      },
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
      },
      description: SITE_DESCRIPTION,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Locale layout — wraps all pages under /[locale]/*                         */
/* -------------------------------------------------------------------------- */

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground focus:underline"
      >
        Skip to main content
      </a>
      <div className="relative flex min-h-svh flex-col">
        <SiteHeader locale={locale} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale} />
      </div>
    </>
  );
}
