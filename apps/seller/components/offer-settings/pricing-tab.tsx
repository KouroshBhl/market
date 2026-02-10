'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button, Card, Input, Label, Select, Alert, toast } from '@workspace/ui';
import type { OfferWithDetails } from '@workspace/contracts';
import type { Currency } from '@workspace/contracts';
import {
  updateOfferPricing,
  getPlatformFee,
  calculateSellerBreakdown,
} from '@/lib/api';
import { useSeller } from '@/components/seller-provider';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'UAH', 'RUB', 'IRR'];

interface PricingTabProps {
  offer: OfferWithDetails;
}

export function PricingTab({ offer }: PricingTabProps) {
  const { activeSeller } = useSeller();
  const queryClient = useQueryClient();
  const [priceAmount, setPriceAmount] = useState<string>(
    (offer.priceAmount / 100).toFixed(2)
  );
  const [currency, setCurrency] = useState<string>(offer.currency);

  // Fetch platform fee configuration (includes payment gateway fee)
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
      }, activeSeller!.sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offer', offer.id] });
      toast({
        title: 'Pricing updated',
        description: 'Offer list price and currency saved.',
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

  // Calculate pricing breakdown
  const priceCents = Math.round(parseFloat(priceAmount || '0') * 100);
  const breakdown = platformFee
    ? calculateSellerBreakdown(
        priceCents,
        platformFee.platformFeeBps,
        platformFee.paymentFeeBps,
      )
    : null;

  const sellerNetNegative = breakdown ? breakdown.sellerNetCents <= 0 : false;

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
    if (sellerNetNegative) {
      toast({
        title: 'Price too low',
        description:
          'Your net earnings would be zero or negative. Please increase the list price.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate();
  };

  // Format currency helper
  const formatPrice = (cents: number) => {
    return (Math.abs(cents) / 100).toFixed(2);
  };

  return (
    <div className='space-y-6'>
      <Card className='p-6'>
        <form onSubmit={handleSubmit} className='space-y-6 max-w-sm'>
          <div className='space-y-2'>
            <Label htmlFor='priceAmount'>List price ({currency}) *</Label>
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
              This is the price buyers will see.
            </p>
            <p className='text-xs text-muted-foreground'>
              Platform and payment fees are deducted from your earnings.
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
          <Button
            type='submit'
            disabled={mutation.isPending || sellerNetNegative}
          >
            {mutation.isPending ? 'Saving…' : 'Save pricing'}
          </Button>
        </form>
      </Card>

      {/* Seller Pricing Breakdown */}
      {breakdown && priceCents > 0 && (
        <Card className='p-6'>
          <h3 className='font-semibold text-foreground mb-4'>
            Earnings Breakdown
          </h3>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>List price:</span>
              <span className='font-medium text-foreground'>
                {currency} {formatPrice(breakdown.listPriceCents)}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>
                Platform fee ({platformFee?.platformFeePercent.toFixed(2)}%):
              </span>
              <span className='font-medium text-foreground'>
                &minus;{currency} {formatPrice(breakdown.platformFeeCents)}
              </span>
            </div>
            {breakdown.paymentFeeBps > 0 && (
              <div className='flex justify-between items-center'>
                <span className='text-muted-foreground'>
                  Payment fee ({platformFee?.paymentFeePercent.toFixed(2)}%):
                </span>
                <span className='font-medium text-foreground'>
                  &minus;{currency} {formatPrice(breakdown.paymentFeeCents)}
                </span>
              </div>
            )}
            <div className='border-t pt-3 flex justify-between items-center'>
              <span className='font-semibold text-foreground'>
                You receive (net):
              </span>
              <span
                className={`font-bold text-lg ${sellerNetNegative ? 'text-destructive' : 'text-foreground'}`}
              >
                {currency} {formatPrice(breakdown.sellerNetCents)}
              </span>
            </div>
          </div>

          {sellerNetNegative && (
            <Alert variant='destructive' className='mt-4'>
              <p className='text-sm'>
                Your net earnings are zero or negative. Increase the list price
                to cover platform and payment fees.
              </p>
            </Alert>
          )}
        </Card>
      )}
    </div>
  );
}
