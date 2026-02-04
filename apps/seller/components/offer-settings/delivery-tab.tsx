'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Card, Input, Label, Button, toast } from '@workspace/ui';
import { SlaSelector } from '@/components/sla-selector';
import type { OfferWithDetails } from '@workspace/contracts';
import { updateOffer } from '@/lib/api';

interface DeliveryTabProps {
  offer: OfferWithDetails;
}

export function DeliveryTab({ offer }: DeliveryTabProps) {
  const queryClient = useQueryClient();
  const isAutoKey = offer.deliveryType === 'AUTO_KEY';
  const isManual = offer.deliveryType === 'MANUAL';
  const hasKeyPool = !!offer.keyPoolId;

  const [deliveryInstructions, setDeliveryInstructions] = useState(
    offer.deliveryInstructions || ''
  );
  const [estimatedDeliveryMinutes, setEstimatedDeliveryMinutes] = useState<number | null>(
    offer.estimatedDeliveryMinutes
  );
  const [stockCount, setStockCount] = useState<string>(
    offer.stockCount !== null ? offer.stockCount.toString() : ''
  );

  useEffect(() => {
    setDeliveryInstructions(offer.deliveryInstructions || '');
    setEstimatedDeliveryMinutes(offer.estimatedDeliveryMinutes);
    setStockCount(offer.stockCount !== null ? offer.stockCount.toString() : '');
  }, [offer.deliveryInstructions, offer.estimatedDeliveryMinutes, offer.stockCount]);

  const mutation = useMutation({
    mutationFn: () =>
      updateOffer(offer.id, {
        deliveryInstructions: deliveryInstructions.trim() || null,
        estimatedDeliveryMinutes,
        stockCount: stockCount ? parseInt(stockCount, 10) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offer', offer.id] });
      toast({
        title: 'Delivery settings updated',
        description: 'Changes apply to future orders only.',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for MANUAL offers
    if (isManual) {
      if (!deliveryInstructions.trim()) {
        toast({
          title: 'Validation error',
          description: 'Delivery instructions are required for manual offers.',
          variant: 'destructive',
        });
        return;
      }

      if (!estimatedDeliveryMinutes || estimatedDeliveryMinutes <= 0) {
        toast({
          title: 'Validation error',
          description: 'Estimated delivery time (SLA) is required for manual offers.',
          variant: 'destructive',
        });
        return;
      }
    }

    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-2">Delivery type</h3>
          <Badge variant="outline">{offer.deliveryType}</Badge>
        </div>

        {isAutoKey && (
          <>
            <div>
              <h3 className="font-semibold text-foreground mb-2">How it works</h3>
              <p className="text-sm text-muted-foreground">
                With Auto-Key delivery, buyers receive their key instantly after payment.
                You upload keys to a secure pool; the system assigns one key per order
                automatically. No manual sending required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Key pool</h3>
              {hasKeyPool ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Badge variant="destructive">Missing</Badge>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {hasKeyPool
                  ? 'A key pool is linked to this offer. Manage keys in the Keys tab.'
                  : 'Create and link a key pool in the Keys tab to enable automatic delivery.'}
              </p>
            </div>
          </>
        )}

        {isManual && (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="deliveryInstructions">
                Delivery Instructions * (required)
              </Label>
              <Input
                id="deliveryInstructions"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="How will you deliver this product to the buyer..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Operational instructions for fulfillment. Not visible to buyers, used internally.
              </p>
            </div>

            <SlaSelector
              value={estimatedDeliveryMinutes}
              onChange={setEstimatedDeliveryMinutes}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="stockCount">Stock Count (optional)</Label>
              <Input
                id="stockCount"
                type="number"
                min="0"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                placeholder="Leave empty for unlimited"
              />
              <p className="text-xs text-muted-foreground">
                Manual stock tracking. Leave empty for unlimited stock.
              </p>
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save delivery settings'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
