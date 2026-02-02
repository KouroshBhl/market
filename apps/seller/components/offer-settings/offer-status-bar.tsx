'use client';

import { Badge } from '@workspace/ui';
import type { OfferWithDetails } from '@workspace/contracts';

interface OfferStatusBarProps {
  offer: OfferWithDetails;
}

function variantSummary(offer: OfferWithDetails): string {
  const v = offer.variant;
  const parts: string[] = [];
  if (v?.region) parts.push(v.region);
  if (v?.durationDays != null) parts.push(`${v.durationDays} days`);
  if (v?.edition) parts.push(v.edition);
  return parts.length ? parts.join(' / ') : '—';
}

export function OfferStatusBar({ offer }: OfferStatusBarProps) {
  const statusLabel =
    offer.status === 'draft'
      ? 'Draft'
      : offer.status === 'active'
        ? 'Active'
        : 'Inactive';
  const statusVariant =
    offer.status === 'draft' ? 'warning' : offer.status === 'active' ? 'success' : 'secondary';
  const availability = offer.availability ?? (offer.autoKeyAvailableCount && offer.autoKeyAvailableCount > 0 ? 'in_stock' : 'out_of_stock');
  const inStock = availability === 'in_stock';
  const deliveryType = offer.deliveryType === 'AUTO_KEY' ? 'AUTO_KEY' : offer.deliveryType;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status</span>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Availability</span>
        <Badge variant={inStock ? 'success' : 'destructive'}>
          {inStock ? 'In stock' : 'Out of stock'}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Delivery</span>
        <Badge variant="outline">{deliveryType}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Variant</span>
        <span className="text-sm font-medium text-foreground">{variantSummary(offer)}</span>
      </div>
    </div>
  );
}
