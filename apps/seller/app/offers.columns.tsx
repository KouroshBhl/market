'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@workspace/ui';
import { MockOffer, formatPrice } from './mockData';

export const offersColumns: ColumnDef<MockOffer>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      return (
        <div className='font-medium text-foreground max-w-xs truncate'>
          {row.getValue('title')}
        </div>
      );
    },
  },
  {
    accessorKey: 'deliveryType',
    header: 'Delivery',
    cell: ({ row }) => {
      const type = row.getValue('deliveryType') as string;
      return (
        <Badge variant='secondary'>
          {type === 'AUTO_KEY' ? 'Auto Key' : 'Manual'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant =
        status === 'active'
          ? ('success' as const)
          : status === 'draft'
            ? ('secondary' as const)
            : ('outline' as const);
      return (
        <Badge variant={variant}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'stockStatus',
    header: 'Stock',
    cell: ({ row }) => {
      const offer = row.original;
      const stockStatus = offer.stockStatus;

      let displayText = '';
      if (offer.deliveryType === 'AUTO_KEY') {
        displayText = `${offer.keyCount || 0} keys`;
      } else {
        displayText = `${offer.stockCount || 0} units`;
      }

      const variant =
        stockStatus === 'in_stock'
          ? ('success' as const)
          : stockStatus === 'low_stock'
            ? ('warning' as const)
            : ('destructive' as const);

      return (
        <div className='flex items-center gap-2'>
          <Badge variant={variant} className='text-xs'>
            {stockStatus === 'in_stock'
              ? 'In Stock'
              : stockStatus === 'low_stock'
                ? 'Low'
                : 'Out'}
          </Badge>
          <span className='text-sm text-muted-foreground'>{displayText}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'priceAmount',
    header: 'Price',
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <div className='text-foreground font-medium'>
          {formatPrice(offer.priceAmount, offer.currency)}
        </div>
      );
    },
  },
];
