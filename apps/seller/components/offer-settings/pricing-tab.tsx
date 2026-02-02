'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Label, Select, toast } from '@workspace/ui';
import type { OfferWithDetails } from '@workspace/contracts';
import type { Currency } from '@workspace/contracts';
import { updateOfferPricing } from '@/lib/api';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'UAH', 'RUB', 'IRR'];

interface PricingTabProps {
  offer: OfferWithDetails;
}

export function PricingTab({ offer }: PricingTabProps) {
  const queryClient = useQueryClient();
  const [priceAmount, setPriceAmount] = useState<string>(
    (offer.priceAmount / 100).toFixed(2)
  );
  const [currency, setCurrency] = useState<string>(offer.currency);

  useEffect(() => {
    setPriceAmount((offer.priceAmount / 100).toFixed(2));
    setCurrency(offer.currency);
  }, [offer.priceAmount, offer.currency]);

  const mutation = useMutation({
    mutationFn: () =>
      updateOfferPricing(offer.id, {
        priceAmount: Math.round(parseFloat(priceAmount) * 100),
        currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offer', offer.id] });
      toast({
        title: 'Pricing updated',
        description: 'Offer price and currency saved.',
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
    const parsed = parseFloat(priceAmount);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast({
        title: 'Invalid price',
        description: 'Enter a valid positive number.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="priceAmount">Price amount</Label>
            <Input
              id="priceAmount"
              type="number"
              step="0.01"
              min="0"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save pricing'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
