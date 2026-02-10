import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Separator } from "@workspace/ui";

import { fetchProductBySlug, fetchOffersForVariant } from "@/lib/api";
import { isValidLocale, generateLocaleAlternates, type Locale } from "@/lib/i18n";

import { ProductStructuredData } from "@/components/product/structured-data";
import { ProductBreadcrumb } from "@/components/product/product-breadcrumb";
import { ProductContent } from "@/components/product/product-content";
import { TrustSection } from "@/components/product/trust-section";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ProductPageProps {
  params: Promise<{ locale: string; productSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                  */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale: localeParam, productSlug } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "en";

  const product = await fetchProductBySlug(productSlug);
  if (!product) {
    return { title: "Product Not Found" };
  }

  const description = product.description
    ? product.description.slice(0, 155).trimEnd()
    : `Buy ${product.name} from trusted sellers on MarketName.`;

  return {
    title: product.name,
    description,
    alternates: generateLocaleAlternates(locale, `/p/${product.slug}`),
    openGraph: {
      title: product.name,
      description,
      type: "website",
      ...(product.imageUrl && { images: [product.imageUrl] }),
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Page component (Server Component)                                         */
/* -------------------------------------------------------------------------- */

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { locale: localeParam, productSlug } = await params;
  const sp = await searchParams;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "en";

  const product = await fetchProductBySlug(productSlug);
  if (!product) {
    notFound();
  }

  /* ── Resolve variant from URL search params ──────────────────────────── */
  const regionParam = typeof sp.region === "string" ? sp.region : null;
  const durationParam = typeof sp.duration === "string" ? sp.duration : null;
  const parsedDuration = durationParam ? parseInt(durationParam, 10) : null;

  let resolvedVariant = product.variants[0]; // safe default

  if (regionParam) {
    // 1. Try exact match: region + duration (+ any edition)
    const exact = product.variants.find(
      (v) =>
        v.region === regionParam &&
        (parsedDuration === null || v.durationDays === parsedDuration),
    );
    if (exact) {
      resolvedVariant = exact;
    } else if (parsedDuration !== null) {
      // 2. Region exists but requested duration doesn't → first variant for region with offers
      const regionFallback =
        product.variants.find(
          (v) => v.region === regionParam && v.offerCount > 0,
        ) ?? product.variants.find((v) => v.region === regionParam);
      if (regionFallback) {
        resolvedVariant = regionFallback;
      }
    }
  } else {
    // No URL params → first variant with offers (original behavior)
    resolvedVariant =
      product.variants.find((v) => v.offerCount > 0) ?? product.variants[0];
  }

  const offersData = resolvedVariant
    ? await fetchOffersForVariant(resolvedVariant.id)
    : { offers: [], platformFeeBps: 300 };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <ProductStructuredData
        product={product}
        offers={offersData.offers}
        platformFeeBps={offersData.platformFeeBps}
        siteUrl={siteUrl}
        locale={locale}
      />

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10 space-y-8">
        <ProductBreadcrumb
          productName={product.name}
          category={product.category}
          locale={locale}
        />

        {resolvedVariant ? (
          <ProductContent
            product={product}
            productId={product.id}
            variants={product.variants}
            initialVariantId={resolvedVariant.id}
            initialOffers={offersData.offers}
            initialPlatformFeeBps={offersData.platformFeeBps}
            locale={locale}
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This product has no active variants yet.
          </p>
        )}

        <Separator />

        {product.description && (
          <>
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                About {product.name}
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line max-w-prose">
                {product.description}
              </div>
            </section>
            <Separator />
          </>
        )}

        <TrustSection />
      </div>
    </>
  );
}
