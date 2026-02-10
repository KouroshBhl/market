import Link from "next/link";
import { Badge, Button, Avatar, AvatarFallback } from "@workspace/ui";
import { Zap, Clock, MessageCircle } from "lucide-react";
import type { PublicOffer } from "@/lib/api";
import { formatMoney, type Currency } from "@/lib/currency";
import { localePath, type Locale } from "@/lib/i18n";

function formatSla(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  if (minutes === 60) return `~1 hour`;
  if (minutes < 1440) return `~${Math.round(minutes / 60)} hours`;
  if (minutes === 1440) return `~1 day`;
  return `~${Math.round(minutes / 1440)} days`;
}

export function OfferCard({
  offer,
  platformFeeBps,
  productId,
  locale,
  isSelected,
  onSelect,
}: {
  offer: PublicOffer;
  platformFeeBps: number;
  productId: string;
  locale: Locale;
  isSelected?: boolean;
  onSelect?: (offerId: string) => void;
}) {
  const buyerTotalCents =
    offer.priceAmountCents +
    Math.round((offer.priceAmountCents * platformFeeBps) / 10000);

  const currency = (offer.currency as Currency) ?? "USD";
  const isInstant = offer.deliveryType === "AUTO_KEY";

  const chatHref = localePath(
    locale,
    `/chats?productId=${productId}&offerId=${offer.id}&sellerId=${offer.sellerId}`,
  );

  // Generate initials from seller name
  const initials = offer.sellerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={`flex flex-col sm:flex-row gap-4 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
        isSelected
          ? "border-primary ring-1 ring-primary/40 bg-accent/30"
          : "border-border"
      }`}
      onClick={() => onSelect?.(offer.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(offer.id);
        }
      }}
    >
      {/* Seller info */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-sm font-medium text-foreground truncate">
              {offer.sellerName}
            </p>
            <p className="text-xs text-muted-foreground">New seller</p>
          </div>

          {/* Delivery badge */}
          {isInstant ? (
            <Badge variant="success" className="text-[11px] gap-1 w-fit">
              <Zap className="size-3" />
              Instant Delivery
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] gap-1 w-fit">
              <Clock className="size-3" />
              {offer.estimatedDeliveryMinutes
                ? formatSla(offer.estimatedDeliveryMinutes)
                : "Manual delivery"}
            </Badge>
          )}
        </div>
      </div>

      {/* Price + CTAs */}
      <div className="flex flex-col sm:items-end gap-3 shrink-0">
        <div className="text-left sm:text-right">
          <p className="text-lg font-bold text-foreground">
            {formatMoney(buyerTotalCents, currency)}
          </p>
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            Add to Cart
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={chatHref} aria-label="Chat with seller">
              <MessageCircle className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
