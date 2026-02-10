import type { Metadata } from "next";

import {
  isValidLocale,
  generateLocaleAlternates,
  type Locale,
} from "@/lib/i18n";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "en";

  return {
    alternates: generateLocaleAlternates(locale),
  };
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-bold text-foreground">
        Welcome to MarketName
      </h1>
      <p className="mt-3 text-muted-foreground max-w-prose">
        Digital marketplace — home page content coming soon.
      </p>
    </div>
  );
}
