'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Alert, AlertDescription, toast } from '@workspace/ui';
import { getKeyPoolByOffer, createKeyPool } from '@/lib/api';
import { useSeller } from '@/components/seller-provider';
import { KeyStatsCard, KeyUploadPanel, KeysTable } from '@/components/keys';

interface KeysTabProps {
  offerId: string;
}

export function KeysTab({ offerId }: KeysTabProps) {
  const queryClient = useQueryClient();
  const { activeSeller } = useSeller();
  const sellerId = activeSeller?.sellerId;

  // Fetch key pool for this offer
  const {
    data: keyPool,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['key-pool', offerId, sellerId],
    queryFn: () => getKeyPoolByOffer(offerId, sellerId!),
    enabled: !!offerId && !!sellerId,
  });

  // Create key pool mutation
  const createPoolMutation = useMutation({
    mutationFn: () => createKeyPool(offerId, sellerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['key-pool', offerId] });
      toast({
        title: 'Key pool created',
        description: 'You can now upload keys for this offer.',
        variant: 'success',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to create key pool',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load key pool: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  // No key pool yet - show create button
  if (!keyPool) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Key Pool
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Create a key pool to start uploading keys for automatic delivery.
            Keys are stored securely and delivered to buyers instantly upon
            purchase.
          </p>
          <Button
            onClick={() => createPoolMutation.mutate()}
            disabled={createPoolMutation.isPending}
          >
            {createPoolMutation.isPending ? 'Creating...' : 'Create Key Pool'}
          </Button>
        </div>
      </Card>
    );
  }

  // Key pool exists - show full management UI
  return (
    <div className="space-y-6">
      {/* Statistics */}
      <KeyStatsCard
        stats={keyPool.counts}
        isOutOfStock={keyPool.counts.available === 0}
      />

      {/* Out of stock warning */}
      {keyPool.counts.available === 0 && keyPool.counts.total > 0 && (
        <Alert>
          <AlertDescription>
            <span className="font-semibold">Out of Stock:</span> All keys have
            been sold or invalidated. Upload more keys to continue selling.
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Panel */}
      <KeyUploadPanel poolId={keyPool.id} offerId={offerId} />

      {/* Keys Table */}
      <KeysTable poolId={keyPool.id} />
    </div>
  );
}
