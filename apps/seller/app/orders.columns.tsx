'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@workspace/ui';
import {
  MockOrder,
  formatPrice,
  formatRelativeTime,
  formatDueTime,
} from './mockData';

export const ordersColumns: ColumnDef<MockOrder>[] = [
  {
    accessorKey: 'displayId',
    header: 'Order ID',
    cell: ({ row }) => {
      return (
        <div className='font-mono text-sm text-foreground'>
          {row.getValue('displayId')}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant =
        status === 'FULFILLED'
          ? ('success' as const)
          : status === 'PAID'
            ? ('warning' as const)
            : status === 'CANCELLED'
              ? ('destructive' as const)
              : ('secondary' as const);

      const displayStatus = status.replace('_', ' ');

      return <Badge variant={variant}>{displayStatus}</Badge>;
    },
  },
  {
    accessorKey: 'isOverdue',
    header: 'Due / Overdue',
    cell: ({ row }) => {
      const order = row.original;

      if (order.status !== 'PAID' || !order.slaDueAt) {
        return <span className='text-muted-foreground text-sm'>—</span>;
      }

      const dueText = formatDueTime(order.slaDueAt);
      const isOverdue = order.isOverdue;

      return (
        <div className='flex items-center gap-2'>
          {isOverdue && (
            <Badge variant='destructive' className='text-xs'>
              Overdue
            </Badge>
          )}
          <span
            className={
              isOverdue
                ? 'text-destructive text-sm'
                : 'text-muted-foreground text-sm'
            }
          >
            {dueText}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'assignedToName',
    header: 'Assigned',
    cell: ({ row }) => {
      const assignedTo = row.getValue('assignedToName') as string | undefined;
      return (
        <div className='text-sm text-muted-foreground'>
          {assignedTo || 'Unassigned'}
        </div>
      );
    },
  },
  {
    accessorKey: 'buyerTotalAmount',
    header: 'Amount',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className='text-foreground font-medium'>
          {formatPrice(order.buyerTotalAmount, order.currency)}
        </div>
      );
    },
  },
  {
    accessorKey: 'paidAt',
    header: 'Paid At',
    cell: ({ row }) => {
      const paidAt = row.getValue('paidAt') as string | undefined;
      return (
        <div className='text-sm text-muted-foreground'>
          {paidAt ? formatRelativeTime(paidAt) : '—'}
        </div>
      );
    },
  },
];
