import type { ProductDetail, PublicOffer } from "@/lib/api";

/**
 * Injects Product + AggregateOffer JSON-LD structured data into <head>.
 * Rendered server-side so crawlers see it in the initial HTML.
 */
export function ProductStructuredData({
  product,
  offers,
  platformFeeBps,
  siteUrl,
  locale,
}: {
  product: ProductDetail;
  offers: PublicOffer[];
  platformFeeBps: number;
  siteUrl: string;
  locale: string;
}) {
  const inStockOffers = offers.filter((o) => o.inStock);

  function buyerTotal(priceCents: number): number {
    return priceCents + Math.round((priceCents * platformFeeBps) / 10000);
  }

  const prices = inStockOffers.map((o) => buyerTotal(o.priceAmountCents));
  const lowPrice = prices.length > 0 ? Math.min(...prices) / 100 : undefined;
  const highPrice = prices.length > 0 ? Math.max(...prices) / 100 : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.imageUrl ?? undefined,
    category: product.category.parent
      ? `${product.category.parent.name} > ${product.category.name}`
      : product.category.name,
    url: `${siteUrl}/${locale}/p/${product.slug}`,
    ...(inStockOffers.length > 0 && {
      offers: {
        "@type": "AggregateOffer",
        lowPrice: lowPrice?.toFixed(2),
        highPrice: highPrice?.toFixed(2),
        priceCurrency: inStockOffers[0]?.currency ?? "USD",
        offerCount: inStockOffers.length,
        availability: "https://schema.org/InStock",
        offers: inStockOffers.slice(0, 10).map((o) => ({
          "@type": "Offer",
          price: (buyerTotal(o.priceAmountCents) / 100).toFixed(2),
          priceCurrency: o.currency,
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: o.sellerSlug },
          ...(o.deliveryType === "MANUAL" &&
            o.estimatedDeliveryMinutes && {
              deliveryLeadTime: {
                "@type": "QuantitativeValue",
                minValue: 0,
                maxValue: o.estimatedDeliveryMinutes,
                unitCode: "MIN",
              },
            }),
        })),
      },
    }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/${locale}`,
      },
      ...(product.category.parent
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.parent.name,
              item: `${siteUrl}/${locale}/c/${product.category.parent.slug}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: product.category.name,
              item: `${siteUrl}/${locale}/c/${product.category.parent.slug}/${product.category.slug}`,
            },
            { "@type": "ListItem", position: 4, name: product.name },
          ]
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: `${siteUrl}/${locale}/c/${product.category.slug}`,
            },
            { "@type": "ListItem", position: 3, name: product.name },
          ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
