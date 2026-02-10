"use client";

import * as React from "react";
import { Button } from "@workspace/ui";
import type { VariantSummary, PublicOffer, OffersForVariantResponse } from "@/lib/api";
import { VariantPicker } from "./variant-picker";
import { OfferCard } from "./offer-card";

type SortMode = "price-asc" | "price-desc" | "speed";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : "http://localhost:4000";

/**
 * Client island: handles variant selection, offers fetching, and sort.
 * Initial offers are passed from the server to avoid a loading flash.
 */
export function OffersSection({
  variants,
  initialVariantId,
  initialOffers,
  initialPlatformFeeBps,
}: {
  variants: VariantSummary[];
  initialVariantId: string;
  initialOffers: PublicOffer[];
  initialPlatformFeeBps: number;
}) {
  const [selectedVariantId, setSelectedVariantId] = React.useState(initialVariantId);
  const [offers, setOffers] = React.useState(initialOffers);
  const [platformFeeBps, setPlatformFeeBps] = React.useState(initialPlatformFeeBps);
  const [sort, setSort] = React.useState<SortMode>("price-asc");
  const [loading, setLoading] = React.useState(false);

  // Fetch offers when variant changes (skip initial since we already have data)
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
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOffers([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [selectedVariantId]);

  // Sort offers
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
          if (a.deliveryType === "AUTO_KEY" && b.deliveryType !== "AUTO_KEY") return -1;
          if (a.deliveryType !== "AUTO_KEY" && b.deliveryType === "AUTO_KEY") return 1;
          return (a.estimatedDeliveryMinutes ?? 0) - (b.estimatedDeliveryMinutes ?? 0);
        });
        break;
    }
    return list;
  }, [offers, sort]);

  const inStockOffers = sortedOffers.filter((o) => o.inStock);

  return (
    <div className="space-y-6">
      {/* Variant picker */}
      {variants.length > 1 && (
        <VariantPicker
          variants={variants}
          selectedId={selectedVariantId}
          onSelect={setSelectedVariantId}
        />
      )}

      {/* Sort controls + offer count */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {loading
            ? "Loading offers…"
            : `All Offers (${inStockOffers.length})`}
        </h2>
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
      </div>

      {/* Offer cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : inStockOffers.length > 0 ? (
        <div className="space-y-3">
          {inStockOffers.map((offer, idx) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              platformFeeBps={platformFeeBps}
              isBest={idx === 0 && sort === "price-asc"}
            />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No offers available for this variant. Try selecting a different option
          or check back later.
        </p>
      )}
    </div>
  );
}
