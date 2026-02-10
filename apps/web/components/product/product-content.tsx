"use client";

import * as React from "react";
import type { VariantSummary, PublicOffer } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { PurchaseSummaryCard } from "./purchase-summary-card";
import { OffersSection } from "./offers-section";

/**
 * Client island that manages the 2-column layout:
 * - Left: Variant picker + Offers list
 * - Right: Sticky purchase summary card (desktop only)
 *
 * Both sides share the same selected variant state.
 */
export function ProductContent({
  productId,
  variants,
  initialVariantId,
  initialOffers,
  initialPlatformFeeBps,
  locale,
}: {
  productId: string;
  variants: VariantSummary[];
  initialVariantId: string;
  initialOffers: PublicOffer[];
  initialPlatformFeeBps: number;
  locale: Locale;
}) {
  const [selectedVariantId, setSelectedVariantId] =
    React.useState(initialVariantId);
  const [offers, setOffers] = React.useState(initialOffers);
  const [platformFeeBps, setPlatformFeeBps] = React.useState(
    initialPlatformFeeBps,
  );

  const selected =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  const inStockOffers = offers.filter((o) => o.inStock);
  const sortedByPrice = [...inStockOffers].sort(
    (a, b) => a.priceAmountCents - b.priceAmountCents,
  );
  const bestOffer = sortedByPrice[0] ?? null;

  // Sync offers and platformFeeBps when variant changes (handled by OffersSection)
  const handleOffersUpdate = React.useCallback(
    (newOffers: PublicOffer[], newFeeBps: number) => {
      setOffers(newOffers);
      setPlatformFeeBps(newFeeBps);
    },
    [],
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Left column: Offers section */}
      <div className="flex-1 w-full min-w-0">
        <OffersSection
          productId={productId}
          variants={variants}
          initialVariantId={selectedVariantId}
          initialOffers={offers}
          initialPlatformFeeBps={platformFeeBps}
          locale={locale}
          onVariantChange={setSelectedVariantId}
          onOffersUpdate={handleOffersUpdate}
        />
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
  );
}
