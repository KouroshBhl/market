import { Badge, Button } from "@workspace/ui";
import { Zap, Clock } from "lucide-react";
import type { PublicOffer } from "@/lib/api";
import { formatMoney, type Currency } from "@/lib/currency";

function formatSla(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  if (minutes === 60) return "~1 hour";
  if (minutes < 1440) return `~${Math.round(minutes / 60)} hours`;
  if (minutes === 1440) return "~1 day";
  return `~${Math.round(minutes / 1440)} days`;
}

export function OfferCard({
  offer,
  platformFeeBps,
  isBest,
}: {
  offer: PublicOffer;
  platformFeeBps: number;
  isBest?: boolean;
}) {
  const buyerTotalCents =
    offer.priceAmountCents +
    Math.round((offer.priceAmountCents * platformFeeBps) / 10000);

  const currency = (offer.currency as Currency) ?? "USD";
  const isInstant = offer.deliveryType === "AUTO_KEY";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-lg border p-4 ${
        isBest ? "border-primary bg-accent/30" : "border-border"
      }`}
    >
      {/* Seller + delivery */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-medium text-foreground truncate">
          {offer.sellerName}
        </p>
        {isInstant ? (
          <Badge variant="success" className="text-[11px] gap-1">
            <Zap className="size-3" />
            Instant Delivery
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[11px] gap-1">
            <Clock className="size-3" />
            {offer.estimatedDeliveryMinutes
              ? formatSla(offer.estimatedDeliveryMinutes)
              : "Manual delivery"}
          </Badge>
        )}
      </div>

      {/* Price + CTA */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="text-right">
          <p className="text-base font-bold text-foreground">
            {formatMoney(buyerTotalCents, currency)}
          </p>
          {platformFeeBps > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {formatMoney(offer.priceAmountCents, currency)} + fee
            </p>
          )}
        </div>
        <Button
          variant={isBest ? "default" : "outline"}
          size="sm"
          className="shrink-0"
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
