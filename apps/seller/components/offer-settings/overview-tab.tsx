'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Switch, Label, toast } from '@workspace/ui';
import type { OfferWithDetails } from '@workspace/contracts';
import { updateOfferStatus } from '@/lib/api';
import { useSeller } from '@/components/seller-provider';

interface OverviewTabProps {
  offer: OfferWithDetails;
  onNavigateToKeys?: () => void;
}

export function OverviewTab({ offer, onNavigateToKeys }: OverviewTabProps) {
  const { activeSeller } = useSeller();
  const queryClient = useQueryClient();
  const isDraft = offer.status === 'draft';
  const isActive = offer.status === 'active';
  const outOfStock =
    offer.availability === 'out_of_stock' ||
    (offer.autoKeyAvailableCount ?? 0) === 0;

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: 'active' | 'inactive' }) =>
      updateOfferStatus(offer.id, { status }, activeSeller!.sellerId),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offer', offer.id] });
      toast({
        title: 'Status updated',
        description: `Offer is now ${status}.`,
        variant: 'success',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Update failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const variantSummary = [
    offer.variant?.region,
    offer.variant?.durationDays != null ? `${offer.variant.durationDays} days` : null,
    offer.variant?.edition,
  ]
    .filter(Boolean)
    .join(' / ') || '—';

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-2">
            <Label className="text-base font-medium">Offer status</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                disabled={isDraft || statusMutation.isPending}
                onCheckedChange={(checked) =>
                  statusMutation.mutate({
                    status: checked ? 'active' : 'inactive',
                  })
                }
              />
              <span className="text-sm text-muted-foreground">
                {isDraft ? 'Draft (publish to activate)' : isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-base font-medium">Availability</Label>
            <div>
              <Badge variant={outOfStock ? 'destructive' : 'success'}>
                {outOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-base font-medium">List Price</Label>
            <p className="text-lg font-semibold text-foreground">
              {(offer.priceAmount / 100).toFixed(2)} {offer.currency}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-base font-medium">Variant</Label>
            <p className="text-sm text-foreground">{variantSummary}</p>
          </div>
        </div>

        {outOfStock && offer.deliveryType === 'AUTO_KEY' && (
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              This offer has no keys available. Upload keys to reactivate sales.
            </p>
            <Button onClick={onNavigateToKeys}>Upload keys to reactivate</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
