import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import "@workspace/ui/globals.css";
import { Providers } from "@/components/providers";
import {
  DEFAULT_LOCALE,
  isValidLocale,
  isRtl,
  type Locale,
} from "@/lib/i18n";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

/**
 * Only `metadataBase` lives here — all other metadata is set in the
 * locale-specific layout at `app/[locale]/layout.tsx` where the locale
 * param is available for canonical URLs and hreflang generation.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
};

/**
 * Root layout — responsible ONLY for:
 *  1. `<html lang>` and `dir` (read from middleware header)
 *  2. Fonts
 *  3. Theme provider
 *
 * Header, footer, metadata, and skip-link live in `[locale]/layout.tsx`.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const localeRaw = headersList.get("x-locale") ?? DEFAULT_LOCALE;
  const locale: Locale = isValidLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE;
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
