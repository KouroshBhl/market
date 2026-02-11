"use client";

import Link from "next/link";
import { Button, Badge, Card } from "@workspace/ui";
import { Zap, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import type { VariantSummary, PublicOffer } from "@/lib/api";
import { formatMoney, type Currency } from "@/lib/currency";
import { localePath, type Locale } from "@/lib/i18n";

function formatDuration(days: number): string {
  if (days <= 1) return "1 Day";
  if (days === 30) return "30 Days";
  if (days === 90) return "90 Days";
  if (days === 365) return "1 Year";
  return `${days} Days`;
}

function formatSla(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  if (minutes === 60) return `~1 hour`;
  if (minutes < 1440) return `~${Math.round(minutes / 60)} hours`;
  if (minutes === 1440) return `~1 day`;
  return `~${Math.round(minutes / 1440)} days`;
}

export function PurchaseSummaryCard({
  productId,
  selectedVariant,
  bestOffer,
  platformFeeBps,
  locale,
}: {
  productId: string;
  selectedVariant: VariantSummary | null;
  bestOffer: PublicOffer | null;
  platformFeeBps: number;
  locale: Locale;
}) {
  if (!selectedVariant) return null;

  const buyerTotalCents = bestOffer
    ? bestOffer.priceAmountCents +
      Math.round((bestOffer.priceAmountCents * platformFeeBps) / 10000)
    : null;

  const currency = (bestOffer?.currency as Currency | undefined) ?? "USD";
  const isInstant = bestOffer?.deliveryType === "AUTO_KEY";

  const chatHref = bestOffer
    ? localePath(
        locale,
        `/chats?productId=${productId}&offerId=${bestOffer.id}&sellerId=${bestOffer.sellerId}`,
      )
    : null;

  return (
    <Card className="p-5 space-y-4 sticky top-20">
      {/* Selected variant */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Selected option
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {selectedVariant.region}
          </Badge>
          {selectedVariant.durationDays !== null && (
            <Badge variant="secondary" className="text-xs">
              {formatDuration(selectedVariant.durationDays)}
            </Badge>
          )}
          {selectedVariant.edition && (
            <Badge variant="secondary" className="text-xs">
              {selectedVariant.edition}
            </Badge>
          )}
        </div>
      </div>

      {/* Price + seller + delivery */}
      {bestOffer ? (
        <>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {buyerTotalCents !== null &&
                formatMoney(buyerTotalCents, currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              Sold by{" "}
              <span className="font-medium text-foreground">
                {bestOffer.sellerSlug}
              </span>
            </p>
          </div>

          {isInstant ? (
            <Badge variant="success" className="text-xs gap-1 w-fit">
              <Zap className="size-3.5" />
              Instant Delivery
            </Badge>
          ) : (
            bestOffer.estimatedDeliveryMinutes && (
              <Badge variant="outline" className="text-xs gap-1 w-fit">
                <Clock className="size-3.5" />
                {formatSla(bestOffer.estimatedDeliveryMinutes)}
              </Badge>
            )
          )}

          <div className="space-y-2 pt-2">
            <Button className="w-full" size="lg">
              Add to Cart
            </Button>
            {chatHref && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link href={chatHref}>
                  <MessageCircle className="size-4" />
                  Chat with seller
                </Link>
              </Button>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
            <ShieldCheck className="size-4 shrink-0 mt-0.5" />
            <p>Buyer protection included</p>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No offers available for this option
        </p>
      )}
    </Card>
  );
}
