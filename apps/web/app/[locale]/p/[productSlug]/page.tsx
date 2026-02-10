import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Separator } from "@workspace/ui";

import { fetchProductBySlug, fetchOffersForVariant } from "@/lib/api";
import { isValidLocale, generateLocaleAlternates, type Locale } from "@/lib/i18n";

import { ProductStructuredData } from "@/components/product/structured-data";
import { ProductBreadcrumb } from "@/components/product/product-breadcrumb";
import { ProductHero } from "@/components/product/product-hero";
import { OffersSection } from "@/components/product/offers-section";
import { TrustSection } from "@/components/product/trust-section";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ProductPageProps {
  params: Promise<{ locale: string; productSlug: string }>;
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: localeParam, productSlug } = await params;
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "en";

  const product = await fetchProductBySlug(productSlug);
  if (!product) {
    notFound();
  }

  // Pick the default variant (first one) and fetch its offers server-side
  const defaultVariant = product.variants[0];
  const offersData = defaultVariant
    ? await fetchOffersForVariant(defaultVariant.id)
    : { offers: [], platformFeeBps: 300 };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      {/* Structured data — rendered in <head> by Next.js */}
      <ProductStructuredData
        product={product}
        offers={offersData.offers}
        platformFeeBps={offersData.platformFeeBps}
        siteUrl={siteUrl}
        locale={locale}
      />

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10 space-y-8">
        {/* Breadcrumb */}
        <ProductBreadcrumb
          productName={product.name}
          category={product.category}
          locale={locale}
        />

        {/* Hero: image + title + quick stats */}
        <ProductHero
          product={product}
          offers={offersData.offers}
          platformFeeBps={offersData.platformFeeBps}
          locale={locale}
        />

        <Separator />

        {/* Variants + Offers (client island) */}
        {defaultVariant ? (
          <OffersSection
            variants={product.variants}
            initialVariantId={defaultVariant.id}
            initialOffers={offersData.offers}
            initialPlatformFeeBps={offersData.platformFeeBps}
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This product has no active variants yet.
          </p>
        )}

        <Separator />

        {/* Product description */}
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

        {/* Trust & guarantee section */}
        <TrustSection />
      </div>
    </>
  );
}
