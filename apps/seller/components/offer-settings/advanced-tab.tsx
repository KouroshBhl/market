'use client';

import { Button, Card, Alert, AlertDescription } from '@workspace/ui';
import type { OfferWithDetails } from '@workspace/contracts';

interface AdvancedTabProps {
  offer: OfferWithDetails;
  onForceDeactivate?: () => void;
}

export function AdvancedTab({ offer, onForceDeactivate }: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-foreground mb-2">Danger zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These actions can affect your offer visibility and orders.
          </p>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-4">
          <div>
            <p className="font-medium text-foreground">Force deactivate offer</p>
            <p className="text-sm text-muted-foreground mt-1">
              Immediately set this offer to inactive. Buyers will no longer see it.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-3"
              onClick={onForceDeactivate}
              disabled={offer.status !== 'active'}
            >
              Force deactivate
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-destructive/50 p-4 space-y-4">
          <p className="font-medium text-foreground">Delete offer</p>
          <Alert variant="destructive">
            <AlertDescription>
              Delete offer is only allowed when there are no orders. This action cannot
              be undone. (Placeholder: implement when order count is available.)
            </AlertDescription>
          </Alert>
          <Button variant="destructive" size="sm" disabled>
            Delete offer (disabled)
          </Button>
        </div>
      </Card>
    </div>
  );
}
