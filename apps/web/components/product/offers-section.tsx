"use client";

import * as React from "react";
import { Button, Separator } from "@workspace/ui";
import type {
  VariantSummary,
  PublicOffer,
  OffersForVariantResponse,
} from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { VariantPicker } from "./variant-picker";
import { OfferCard } from "./offer-card";

type SortMode = "price-asc" | "price-desc" | "speed";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : "http://localhost:4000";

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

export function OffersSection({
  productId,
  variants,
  initialVariantId,
  initialOffers,
  initialPlatformFeeBps,
  locale,
  onVariantChange,
  onOffersUpdate,
}: {
  productId: string;
  variants: VariantSummary[];
  initialVariantId: string;
  initialOffers: PublicOffer[];
  initialPlatformFeeBps: number;
  locale: Locale;
  onVariantChange: (id: string) => void;
  onOffersUpdate: (offers: PublicOffer[], platformFeeBps: number) => void;
}) {
  const [selectedVariantId, setSelectedVariantId] =
    React.useState(initialVariantId);
  const [offers, setOffers] = React.useState(initialOffers);
  const [platformFeeBps, setPlatformFeeBps] = React.useState(
    initialPlatformFeeBps,
  );
  const [sort, setSort] = React.useState<SortMode>("price-asc");
  const [loading, setLoading] = React.useState(false);

  const selected =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  /* Fetch offers when variant changes */
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/public/offers/by-variant/${selectedVariantId}`)
      .then((r) => r.json())
      .then((data: OffersForVariantResponse) => {
        if (!cancelled) {
          setOffers(data.offers);
          setPlatformFeeBps(data.platformFeeBps);
          onOffersUpdate(data.offers, data.platformFeeBps);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOffers([]);
          onOffersUpdate([], platformFeeBps);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedVariantId, onOffersUpdate, platformFeeBps]);

  function handleVariantSelect(id: string) {
    setSelectedVariantId(id);
    onVariantChange(id);
  }

  /* Sort */
  const sortedOffers = React.useMemo(() => {
    const list = [...offers];
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.priceAmountCents - b.priceAmountCents);
        break;
      case "price-desc":
        list.sort((a, b) => b.priceAmountCents - a.priceAmountCents);
        break;
      case "speed":
        list.sort((a, b) => {
          if (a.deliveryType === "AUTO_KEY" && b.deliveryType !== "AUTO_KEY")
            return -1;
          if (a.deliveryType !== "AUTO_KEY" && b.deliveryType === "AUTO_KEY")
            return 1;
          return (
            (a.estimatedDeliveryMinutes ?? 0) -
            (b.estimatedDeliveryMinutes ?? 0)
          );
        });
        break;
    }
    return list;
  }, [offers, sort]);

  const inStockOffers = sortedOffers.filter((o) => o.inStock);

  return (
    <div className="space-y-6">
      {/* Variant selector */}
      {variants.length > 1 && (
        <>
          <VariantPicker
            variants={variants}
            selectedId={selectedVariantId}
            onSelect={handleVariantSelect}
          />
          <Separator />
        </>
      )}

      {/* Offers header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {loading
            ? "Loading offers…"
            : selected
              ? `Offers for ${variantLabel(selected)} (${inStockOffers.length})`
              : `All Offers (${inStockOffers.length})`}
        </h2>
        {!loading && inStockOffers.length > 0 && (
          <div className="flex gap-1">
            {(
              [
                ["price-asc", "Price ↑"],
                ["price-desc", "Price ↓"],
                ["speed", "Speed"],
              ] as [SortMode, string][]
            ).map(([mode, label]) => (
              <Button
                key={mode}
                variant={sort === mode ? "secondary" : "ghost"}
                size="sm"
                className="text-xs"
                onClick={() => setSort(mode)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Offer cards or empty state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : inStockOffers.length > 0 ? (
        <div className="space-y-3">
          {inStockOffers.map((offer, idx) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              platformFeeBps={platformFeeBps}
              productId={productId}
              locale={locale}
              isBest={idx === 0 && sort === "price-asc"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border py-10 px-6 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            {selected
              ? `No offers for ${variantLabel(selected)} yet`
              : "No offers available"}
          </p>
          <p className="text-xs text-muted-foreground">
            Try a different variant above, or check back later.
          </p>
          <p className="text-[11px] text-muted-foreground pt-3">
            Have stock?{" "}
            <a
              href="https://seller.localhost:3002"
              rel="noopener"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Sell this item
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
