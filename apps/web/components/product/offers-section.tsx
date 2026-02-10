"use client";

import * as React from "react";
import { Button } from "@workspace/ui";
import type { VariantSummary, PublicOffer } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { OfferCard } from "./offer-card";

type SortMode = "price-asc" | "price-desc" | "speed";

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
  selectedVariant,
  offers,
  platformFeeBps,
  locale,
  instantOnly,
  loading,
}: {
  productId: string;
  selectedVariant: VariantSummary | null;
  offers: PublicOffer[];
  platformFeeBps: number;
  locale: Locale;
  instantOnly: boolean;
  loading: boolean;
}) {
  const [sort, setSort] = React.useState<SortMode>("price-asc");

  /* Sort offers */
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

  return (
    <div className="space-y-6">
      {/* Offers header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {loading
            ? "Loading offers…"
            : selectedVariant
              ? `Offers for ${variantLabel(selectedVariant)} (${sortedOffers.length})`
              : `All Offers (${sortedOffers.length})`}
        </h2>
        {!loading && sortedOffers.length > 0 && (
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
      ) : sortedOffers.length > 0 ? (
        <div className="space-y-3">
          {sortedOffers.map((offer, idx) => (
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
      ) : instantOnly ? (
        <div className="rounded-lg border border-border py-10 px-6 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            No instant delivery offers for this variant
          </p>
          <p className="text-xs text-muted-foreground">
            Try disabling the instant delivery filter above to see all offers.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border py-10 px-6 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            {selectedVariant
              ? `No offers for ${variantLabel(selectedVariant)} yet`
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
