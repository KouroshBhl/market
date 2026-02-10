"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Separator, Switch, Label } from "@workspace/ui";
import { Zap } from "lucide-react";
import type { ProductDetail, VariantSummary, PublicOffer } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { formatMoney, type Currency } from "@/lib/currency";
import { PurchaseSummaryCard } from "./purchase-summary-card";
import { VariantPicker } from "./variant-picker";
import { OffersSection } from "./offers-section";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatDuration(days: number): string {
  if (days <= 1) return "1 Day";
  if (days === 30) return "30 Days";
  if (days === 90) return "90 Days";
  if (days === 365) return "1 Year";
  return `${days} Days`;
}

function variantLabel(v: VariantSummary): string {
  const parts: string[] = [v.region];
  if (v.durationDays !== null) parts.push(formatDuration(v.durationDays));
  if (v.edition) parts.push(v.edition);
  return parts.join(" · ");
}

/* -------------------------------------------------------------------------- */
/*  ProductContent — client island                                            */
/* -------------------------------------------------------------------------- */

/**
 * Manages:
 * - Hero section (product info left, sticky purchase card right)
 * - Offers section below (full width)
 * - URL state sync for region, duration, offer, instant
 * - Single source of truth for selected offer
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

  /* ── Refs for scroll targets ──────────────────────────────────────────── */
  const variantPickerRef = React.useRef<HTMLDivElement>(null);
  const offersSectionRef = React.useRef<HTMLDivElement>(null);

  /* ── Core state (initialized from server-resolved props — no flash) ──── */
  const [selectedVariantId, setSelectedVariantId] =
    React.useState(initialVariantId);
  const [offers, setOffers] = React.useState(initialOffers);
  const [platformFeeBps, setPlatformFeeBps] = React.useState(
    initialPlatformFeeBps,
  );
  const [instantOnly, setInstantOnly] = React.useState(
    searchParams.get("instant") === "1",
  );
  const [loading, setLoading] = React.useState(false);

  // Single source of truth for selected offer (Task B)
  const [selectedOfferId, setSelectedOfferId] = React.useState<string | null>(
    searchParams.get("offer"),
  );

  // Variant picker highlight animation (Task A)
  const [variantHighlight, setVariantHighlight] = React.useState(false);

  /* ── Derived values ────────────────────────────────────────────────────── */
  const selected =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  const inStockOffers = offers.filter((o) => o.inStock);
  const hasInstantDelivery = inStockOffers.some(
    (o) => o.deliveryType === "AUTO_KEY",
  );

  const filteredOffers = instantOnly
    ? inStockOffers.filter((o) => o.deliveryType === "AUTO_KEY")
    : inStockOffers;

  const sortedByPrice = [...filteredOffers].sort(
    (a, b) => a.priceAmountCents - b.priceAmountCents,
  );

  // Selected offer: explicit selection OR cheapest as default
  const selectedOffer: PublicOffer | null = selectedOfferId
    ? (sortedByPrice.find((o) => o.id === selectedOfferId) ??
      sortedByPrice[0] ??
      null)
    : (sortedByPrice[0] ?? null);

  const lowestPrice =
    filteredOffers.length > 0
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

  /* ── URL sync on mount (correct params if server applied fallback) ───── */
  React.useEffect(() => {
    const variant = variants.find((v) => v.id === initialVariantId);
    if (!variant) return;

    const params = new URLSearchParams(window.location.search);
    const region = params.get("region");
    const duration = params.get("duration");

    if (!region && !duration) return;

    let needsCorrection = false;
    if (region && variant.region !== region) needsCorrection = true;
    if (duration && variant.durationDays?.toString() !== duration)
      needsCorrection = true;
    if (region && !duration && variant.durationDays !== null)
      needsCorrection = true;

    if (needsCorrection) {
      params.set("region", variant.region);
      if (variant.durationDays !== null) {
        params.set("duration", variant.durationDays.toString());
      } else {
        params.delete("duration");
      }
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Fetch offers when variant changes (skip first — server already fetched) */
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

  /* ── URL update helper ─────────────────────────────────────────────── */
  const updateUrl = React.useCallback(
    (updates: {
      variantId?: string;
      offerId?: string | null;
      instant?: boolean;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.variantId !== undefined) {
        const variant = variants.find((v) => v.id === updates.variantId);
        if (variant) {
          params.set("region", variant.region);
          if (variant.durationDays !== null) {
            params.set("duration", variant.durationDays.toString());
          } else {
            params.delete("duration");
          }
        }
      }

      if (updates.offerId !== undefined) {
        if (updates.offerId) {
          params.set("offer", updates.offerId);
        } else {
          params.delete("offer");
        }
      }

      if (updates.instant !== undefined) {
        if (updates.instant) {
          params.set("instant", "1");
        } else {
          params.delete("instant");
        }
      }

      const newUrl = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${window.location.pathname}${newUrl}`, { scroll: false });
    },
    [router, searchParams, variants],
  );

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    setSelectedOfferId(null); // clear stale offer selection
    setInstantOnly(false);
    updateUrl({ variantId, offerId: null, instant: false });
  };

  const handleInstantToggle = (checked: boolean) => {
    setInstantOnly(checked);
    updateUrl({ instant: checked });
  };

  const handleOfferSelect = (offerId: string) => {
    setSelectedOfferId(offerId);
    updateUrl({ offerId });

    // Task C: scroll to top of offers area if the user scrolled past it
    if (offersSectionRef.current) {
      const rect = offersSectionRef.current.getBoundingClientRect();
      if (rect.top < 0) {
        offersSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  const handleScrollToVariants = () => {
    variantPickerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setVariantHighlight(true);
    setTimeout(() => setVariantHighlight(false), 1500);
  };

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* ─── Hero section: 2-column layout ─────────────────────────────── */}
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

              {/* Buyer-friendly stats (Task D: no raw admin text in hero) */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>
                  {inStockOffers.length}{" "}
                  {inStockOffers.length === 1 ? "offer" : "offers"} available
                </span>
                {lowestPrice !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      From {formatMoney(lowestPrice, defaultCurrency)}
                    </span>
                  </>
                )}
              </div>

              {hasInstantDelivery && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Zap className="size-4" />
                  Instant delivery available
                </p>
              )}
            </div>
          </div>

          {/* Variant picker */}
          {variants.length > 1 && (
            <>
              <Separator />
              <div
                ref={variantPickerRef}
                className={`transition-all duration-300 rounded-lg ${
                  variantHighlight ? "ring-2 ring-primary/50 p-3 -m-3" : ""
                }`}
              >
                <VariantPicker
                  variants={variants}
                  selectedId={selectedVariantId}
                  onSelect={handleVariantChange}
                />
              </div>
            </>
          )}
        </div>

        {/* Right column: Sticky purchase card (desktop only) */}
        <aside className="hidden lg:block w-[320px] shrink-0">
          <PurchaseSummaryCard
            productId={productId}
            selectedVariant={selected ?? null}
            bestOffer={selectedOffer}
            platformFeeBps={platformFeeBps}
            locale={locale}
          />
        </aside>
      </div>

      <Separator />

      {/* ─── Offers section (full width) ───────────────────────────────── */}
      <div ref={offersSectionRef} className="space-y-6">
        {/* Task A: Variant context label + Change action */}
        {selected && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm text-muted-foreground">
              Showing offers for{" "}
              <span className="font-medium text-foreground">
                {variantLabel(selected)}
              </span>
            </p>
            {variants.length > 1 && (
              <Button
                variant="link"
                size="sm"
                className="text-xs h-auto p-0"
                onClick={handleScrollToVariants}
              >
                Change
              </Button>
            )}
          </div>
        )}

        {/* Instant delivery filter */}
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
          selectedOfferId={selectedOffer?.id ?? null}
          onOfferSelect={handleOfferSelect}
        />
      </div>

      {/* Mobile: Purchase card at bottom */}
      <div className="lg:hidden">
        <PurchaseSummaryCard
          productId={productId}
          selectedVariant={selected ?? null}
          bestOffer={selectedOffer}
          platformFeeBps={platformFeeBps}
          locale={locale}
        />
      </div>
    </div>
  );
}
