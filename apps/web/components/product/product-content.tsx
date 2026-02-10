"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge, Separator, Switch, Label } from "@workspace/ui";
import { Zap } from "lucide-react";
import type { ProductDetail, VariantSummary, PublicOffer } from "@/lib/api";
import type { Locale, localePath } from "@/lib/i18n";
import { formatMoney, type Currency } from "@/lib/currency";
import { PurchaseSummaryCard } from "./purchase-summary-card";
import { VariantPicker } from "./variant-picker";
import { OffersSection } from "./offers-section";

function formatDuration(days: number): string {
  if (days <= 1) return "1 Day";
  if (days === 30) return "30 Days";
  if (days === 90) return "90 Days";
  if (days === 365) return "1 Year";
  return `${days} Days`;
}

/**
 * Client island that manages:
 * - Hero section with 2 columns (product info left, sticky card right)
 * - Offers section below (full width)
 * - Instant delivery filter
 */
export function ProductContent({
  product,
  productId,
  variants,
  initialVariantId,
  initialOffers,
  initialPlatformFeeBps,
  locale,
}: {
  product: ProductDetail;
  productId: string;
  variants: VariantSummary[];
  initialVariantId: string;
  initialOffers: PublicOffer[];
  initialPlatformFeeBps: number;
  locale: Locale;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedVariantId, setSelectedVariantId] =
    React.useState(initialVariantId);
  const [offers, setOffers] = React.useState(initialOffers);
  const [platformFeeBps, setPlatformFeeBps] = React.useState(
    initialPlatformFeeBps,
  );

  // Instant delivery filter from URL
  const instantOnlyParam = searchParams.get("instant");
  const [instantOnly, setInstantOnly] = React.useState(instantOnlyParam === "1");

  const selected =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  const inStockOffers = offers.filter((o) => o.inStock);
  const hasInstantDelivery = inStockOffers.some(
    (o) => o.deliveryType === "AUTO_KEY",
  );

  // Apply instant filter
  const filteredOffers = instantOnly
    ? inStockOffers.filter((o) => o.deliveryType === "AUTO_KEY")
    : inStockOffers;

  const sortedByPrice = [...filteredOffers].sort(
    (a, b) => a.priceAmountCents - b.priceAmountCents,
  );
  const bestOffer = sortedByPrice[0] ?? null;

  const lowestPrice = filteredOffers.length > 0
    ? Math.min(
        ...filteredOffers.map(
          (o) =>
            o.priceAmountCents +
            Math.round((o.priceAmountCents * platformFeeBps) / 10000),
        ),
      )
    : null;

  const defaultCurrency =
    (filteredOffers[0]?.currency as Currency | undefined) ?? "USD";

  const categoryHref = product.category.parent
    ? `/c/${product.category.parent.slug}/${product.category.slug}`
    : `/c/${product.category.slug}`;

  const shortDesc = product.description
    ? product.description.length > 200
      ? product.description.slice(0, 200).trimEnd() + "…"
      : product.description
    : null;

  // Fetch offers when variant changes
  const [loading, setLoading] = React.useState(false);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    const API_BASE =
      typeof window !== "undefined"
        ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
        : "http://localhost:4000";

    fetch(`${API_BASE}/public/offers/by-variant/${selectedVariantId}`)
      .then((r) => r.json())
      .then((data: { offers: PublicOffer[]; platformFeeBps: number }) => {
        if (!cancelled) {
          setOffers(data.offers);
          setPlatformFeeBps(data.platformFeeBps);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOffers([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedVariantId]);

  // Handle instant filter toggle
  const handleInstantToggle = (checked: boolean) => {
    setInstantOnly(checked);
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("instant", "1");
    } else {
      params.delete("instant");
    }
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    // Use replace to avoid polluting history
    router.replace(`${window.location.pathname}${newUrl}`, { scroll: false });
  };

  return (
    <div className="space-y-8">
      {/* Hero section: 2-column layout (product info + sticky card) */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Left column: Product image + info + variant picker */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Product image + title */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Product image */}
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

            {/* Product info */}
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

              {hasInstantDelivery && (
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

          {/* Variant picker */}
          {variants.length > 1 && (
            <>
              <Separator />
              <VariantPicker
                variants={variants}
                selectedId={selectedVariantId}
                onSelect={(id) => {
                  setSelectedVariantId(id);
                  // Reset instant filter when variant changes
                  setInstantOnly(false);
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("instant");
                  const newUrl = params.toString() ? `?${params.toString()}` : "";
                  router.replace(`${window.location.pathname}${newUrl}`, {
                    scroll: false,
                  });
                }}
              />
            </>
          )}
        </div>

        {/* Right column: Sticky purchase card (desktop only) */}
        <aside className="hidden lg:block w-[320px] shrink-0">
          <PurchaseSummaryCard
            productId={productId}
            selectedVariant={selected ?? null}
            bestOffer={bestOffer}
            platformFeeBps={platformFeeBps}
            locale={locale}
          />
        </aside>
      </div>

      <Separator />

      {/* Offers section (full width) */}
      <div className="space-y-6">
        {/* Instant delivery filter (only show if instant offers exist) */}
        {hasInstantDelivery && (
          <div className="flex items-center gap-2">
            <Switch
              id="instant-filter"
              checked={instantOnly}
              onCheckedChange={handleInstantToggle}
            />
            <Label
              htmlFor="instant-filter"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Instant delivery only
            </Label>
          </div>
        )}

        <OffersSection
          productId={productId}
          selectedVariant={selected ?? null}
          offers={filteredOffers}
          platformFeeBps={platformFeeBps}
          locale={locale}
          instantOnly={instantOnly}
          loading={loading}
        />
      </div>

      {/* Mobile: Purchase card at bottom */}
      <div className="lg:hidden">
        <PurchaseSummaryCard
          productId={productId}
          selectedVariant={selected ?? null}
          bestOffer={bestOffer}
          platformFeeBps={platformFeeBps}
          locale={locale}
        />
      </div>
    </div>
  );
}
