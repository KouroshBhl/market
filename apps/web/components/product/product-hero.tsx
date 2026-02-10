import Link from "next/link";
import { Badge } from "@workspace/ui";
import { localePath, type Locale } from "@/lib/i18n";
import type { ProductDetail, PublicOffer } from "@/lib/api";
import { formatMoney, type Currency } from "@/lib/currency";
import { Zap } from "lucide-react";

export function ProductHero({
  product,
  offers,
  platformFeeBps,
  locale,
}: {
  product: ProductDetail;
  offers: PublicOffer[];
  platformFeeBps: number;
  locale: Locale;
}) {
  const inStockOffers = offers.filter((o) => o.inStock);
  const hasAutoKey = inStockOffers.some((o) => o.deliveryType === "AUTO_KEY");

  function buyerTotal(priceCents: number) {
    return priceCents + Math.round((priceCents * platformFeeBps) / 10000);
  }

  const lowestPrice =
    inStockOffers.length > 0
      ? Math.min(...inStockOffers.map((o) => buyerTotal(o.priceAmountCents)))
      : null;

  const defaultCurrency =
    (inStockOffers[0]?.currency as Currency | undefined) ?? "USD";

  const categoryHref = product.category.parent
    ? localePath(
        locale,
        `/c/${product.category.parent.slug}/${product.category.slug}`,
      )
    : localePath(locale, `/c/${product.category.slug}`);

  const shortDesc = product.description
    ? product.description.length > 200
      ? product.description.slice(0, 200).trimEnd() + "…"
      : product.description
    : null;

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-10">
      {/* Product image / placeholder */}
      <div className="shrink-0 w-full md:w-[280px] aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl font-bold text-muted-foreground/40 select-none">
            {product.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3 min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {product.name}
        </h1>

        <Link href={categoryHref}>
          <Badge variant="secondary" className="w-fit cursor-pointer">
            {product.category.name}
          </Badge>
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            {inStockOffers.length}{" "}
            {inStockOffers.length === 1 ? "seller" : "sellers"}
          </span>
          {lowestPrice !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>From {formatMoney(lowestPrice, defaultCurrency)}</span>
            </>
          )}
        </div>

        {hasAutoKey && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Zap className="size-4" />
            Instant delivery available
          </p>
        )}

        {shortDesc && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
            {shortDesc}
          </p>
        )}
      </div>
    </div>
  );
}
