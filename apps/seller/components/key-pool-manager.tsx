'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Label,
  Alert,
  AlertDescription,
  Badge,
  Textarea,
  toast,
} from '@workspace/ui';
import type { KeyPoolWithCounts, UploadKeysResponse } from '@workspace/contracts';
import { authedFetch } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface KeyPoolManagerProps {
  offerId: string;
  sellerId: string;
  onPoolCreated?: (poolId: string) => void;
}

export function KeyPoolManager({ offerId, sellerId, onPoolCreated }: KeyPoolManagerProps) {
  const queryClient = useQueryClient();
  const [keysText, setKeysText] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadKeysResponse | null>(null);

  // Fetch key pool for this offer
  const { data: keyPool, isLoading, error, refetch } = useQuery<KeyPoolWithCounts | null>({
    queryKey: ['key-pool', offerId],
    queryFn: async () => {
      const response = await authedFetch(
        `${API_URL}/seller/${sellerId}/key-pools/by-offer/${offerId}`
      );
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch key pool');
      }
      return response.json();
    },
    enabled: !!offerId,
  });

  // Create key pool mutation
  const createPoolMutation = useMutation({
    mutationFn: async () => {
      const response = await authedFetch(`${API_URL}/seller/${sellerId}/key-pools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create key pool');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['key-pool', offerId] });
      onPoolCreated?.(data.id);
      toast({
        title: "✓ Success",
        description: "Key pool created successfully",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "✕ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload keys mutation
  const uploadKeysMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      if (!keyPool) throw new Error('No key pool');
      const response = await authedFetch(
        `${API_URL}/seller/${sellerId}/key-pools/${keyPool.id}/keys/upload`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload keys');
      }
      return response.json() as Promise<UploadKeysResponse>;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      setKeysText('');
      queryClient.invalidateQueries({ queryKey: ['key-pool', offerId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "✓ Keys Uploaded",
        description: `Added ${data.added} keys (${data.duplicates} duplicates, ${data.invalid} invalid)`,
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "✕ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    const keys = keysText
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keys.length === 0) {
      toast({
        title: "Warning",
        description: "Please enter at least one key",
        variant: "destructive",
      });
      return;
    }

    uploadKeysMutation.mutate(keys);
  };

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
        <AlertDescription>Failed to load key pool: {(error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  // No key pool yet - show create button
  if (!keyPool) {
    return (
      <Card className="p-6">
        <div className="text-center py-4">
          <h3 className="font-semibold text-foreground mb-2">No Key Pool</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a key pool to start uploading keys for automatic delivery
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

  // Key pool exists - show upload UI
  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-4">Key Pool</h3>
        
        {/* Key Counts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-foreground">{keyPool.counts.total}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Available</p>
            <p className="text-2xl font-bold text-foreground">{keyPool.counts.available}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Reserved</p>
            <p className="text-2xl font-bold text-foreground">{keyPool.counts.reserved}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Delivered</p>
            <p className="text-2xl font-bold text-foreground">{keyPool.counts.delivered}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Invalid</p>
            <p className="text-2xl font-bold text-foreground">{keyPool.counts.invalid}</p>
          </div>
        </div>

        {/* Stock Status */}
        {keyPool.counts.available === 0 && (
          <Alert className="mb-4">
            <AlertDescription>
              <span className="font-semibold">Out of Stock:</span> Upload keys to make this offer purchasable
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Upload Keys Section */}
      <div className="border-t border-border pt-6">
        <Label htmlFor="keys-textarea" className="text-base font-semibold">
          Upload Keys
        </Label>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Enter keys below, one per line. Duplicates will be automatically detected and skipped.
        </p>
        <Textarea
          id="keys-textarea"
          className="min-h-[10rem] font-mono text-sm resize-none"
          placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY&#10;ZZZZ-ZZZZ-ZZZZ-ZZZZ"
          value={keysText}
          onChange={(e) => setKeysText(e.target.value)}
        />
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <p className="text-xs text-muted-foreground">
            {keysText.split('\n').filter((k) => k.trim().length > 0).length} keys entered
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Coming soon"
            >
              Upload from file
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadKeysMutation.isPending || keysText.trim().length === 0}
            >
              {uploadKeysMutation.isPending ? 'Uploading...' : 'Upload Keys'}
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <Alert className="border-border">
          <AlertDescription>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{uploadResult.added} added</Badge>
              {uploadResult.duplicates > 0 && (
                <Badge variant="secondary">{uploadResult.duplicates} duplicates</Badge>
              )}
              {uploadResult.invalid > 0 && (
                <Badge variant="destructive">{uploadResult.invalid} invalid</Badge>
              )}
              <Badge variant="outline">{uploadResult.totalAvailable} total available</Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
