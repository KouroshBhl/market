'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button, Card, Input, Label, Select, toast } from '@workspace/ui';
import type { OfferWithDetails } from '@workspace/contracts';
import type { Currency } from '@workspace/contracts';
import {
  updateOfferPricing,
  getPlatformFee,
  calculateCommission,
} from '@/lib/api';

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

  // Fetch platform fee configuration
  const { data: platformFee } = useQuery({
    queryKey: ['platformFee'],
    queryFn: getPlatformFee,
  });

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
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Enter a valid positive number.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate();
  };

  // Calculate pricing preview
  const priceCents = Math.round(parseFloat(priceAmount || '0') * 100);
  const commission = platformFee
    ? calculateCommission(priceCents, platformFee.platformFeeBps)
    : null;

  // Format currency helper
  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className='space-y-6'>
      <Card className='p-6'>
        <form onSubmit={handleSubmit} className='space-y-6 max-w-sm'>
          <div className='space-y-2'>
            <Label htmlFor='priceAmount'>Price ({currency}) *</Label>
            <Input
              id='priceAmount'
              type='number'
              step='0.01'
              min='0.01'
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder='0.00'
              required
            />
            <p className='text-sm text-muted-foreground'>
              This is the amount you will receive per sale
            </p>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='currency'>Currency *</Label>
            <Select
              id='currency'
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <Button type='submit' disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save pricing'}
          </Button>
        </form>
      </Card>

      {/* Pricing Preview Card */}
      {commission && priceCents > 0 && (
        <Card className='p-6'>
          <h3 className='font-semibold text-foreground mb-4'>
            Pricing Preview
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>
                Your price (seller receives):
              </span>
              <span className='font-medium text-foreground'>
                {currency} {formatPrice(commission.sellerPriceCents)}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>
                Platform fee ({platformFee?.platformFeePercent.toFixed(2)}%):
              </span>
              <span className='font-medium text-foreground'>
                +{currency} {formatPrice(commission.feeAmountCents)}
              </span>
            </div>
            <div className='border-t pt-3 flex justify-between items-center'>
              <span className='font-semibold text-foreground'>Buyer pays:</span>
              <span className='font-bold text-foreground text-lg'>
                {currency} {formatPrice(commission.buyerTotalCents)}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
