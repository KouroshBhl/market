'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, toast } from '@workspace/ui';
import type { OfferWithDetails } from '@workspace/contracts';
import { updateOffer } from '@/lib/api';
import { useSeller } from '@/components/seller-provider';
import { MarkdownEditor } from '@/components/markdown-editor';

interface DescriptionTabProps {
  offer: OfferWithDetails;
}

export function DescriptionTab({ offer }: DescriptionTabProps) {
  const { activeSeller } = useSeller();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(offer.descriptionMarkdown ?? '');

  useEffect(() => {
    setValue(offer.descriptionMarkdown ?? '');
  }, [offer.descriptionMarkdown]);

  const mutation = useMutation({
    mutationFn: () =>
      updateOffer(offer.id, {
        descriptionMarkdown: value.trim() || null,
      }, activeSeller!.sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offer', offer.id] });
      toast({
        title: 'Description saved',
        description: 'Your offer description has been updated.',
        variant: 'success',
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Save failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <MarkdownEditor
            value={value}
            onChange={setValue}
            label="Offer description"
            helperText="Supports **bold**, _italic_, lists, headings, and emojis. Visible to buyers."
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save description'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
