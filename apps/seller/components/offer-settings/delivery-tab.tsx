'use client';

import { Badge, Card } from '@workspace/ui';
import type { OfferWithDetails } from '@workspace/contracts';

interface DeliveryTabProps {
  offer: OfferWithDetails;
}

export function DeliveryTab({ offer }: DeliveryTabProps) {
  const isAutoKey = offer.deliveryType === 'AUTO_KEY';
  const hasKeyPool = !!offer.keyPoolId;

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
      </Card>
    </div>
  );
}
