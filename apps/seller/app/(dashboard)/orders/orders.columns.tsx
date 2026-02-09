'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@workspace/ui';
import { AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
export type WorkState = 'UNASSIGNED' | 'IN_PROGRESS' | 'DONE' | null;

export interface OrderRow {
  id: string;
  status: OrderStatus;
  basePriceAmount: number;
  buyerTotalAmount: number;
  currency: string;
  paidAt: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  isOverdue: boolean;
  slaDueAt: string | null;
  assignedToUserId: string | null;
  workState: WorkState;
  assignedTo: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  offer: {
    id: string;
    deliveryType: string;
    estimatedDeliveryMinutes: number | null;
    variant: {
      sku: string;
      region: string;
      product: {
        name: string;
      };
    };
  };
}

const formatPrice = (cents: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: 'offer.variant.product.name',
    header: 'Product',
    cell: ({ row }) => {
      const product = row.original.offer.variant.product.name;
      const sku = row.original.offer.variant.sku;
      const region = row.original.offer.variant.region;
      
      return (
        <Link 
          href={`/orders/${row.original.id}`} 
          className="block cursor-pointer font-medium text-foreground hover:underline"
        >
          <div>{product}</div>
          <div className="text-muted-foreground text-xs font-normal">
            {sku} • {region}
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Status
          {isSorted === 'asc' && <ArrowUp className="size-4" />}
          {isSorted === 'desc' && <ArrowDown className="size-4" />}
          {!isSorted && <ArrowUpDown className="size-4 opacity-50" />}
        </button>
      );
    },
    cell: ({ row }) => {
      const status = row.original.status;
      const isOverdue = row.original.isOverdue;
      
      let badge;
      switch (status) {
        case 'PENDING_PAYMENT':
          badge = <Badge variant="secondary">Pending Payment</Badge>;
          break;
        case 'PAID':
          badge = <Badge className="bg-blue-500">Paid</Badge>;
          break;
        case 'FULFILLED':
          badge = <Badge variant="success">Fulfilled</Badge>;
          break;
        case 'CANCELLED':
          badge = <Badge variant="destructive">Cancelled</Badge>;
          break;
        case 'EXPIRED':
          badge = <Badge variant="secondary">Expired</Badge>;
          break;
      }
      
      return (
        <div className="flex items-center gap-2">
          {badge}
          {isOverdue && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="size-3" />
              Overdue
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'workState',
    header: 'Work',
    cell: ({ row }) => {
      const workState = row.original.workState;
      
      if (!workState || workState === 'UNASSIGNED') {
        return <Badge variant="outline">Unassigned</Badge>;
      }
      if (workState === 'IN_PROGRESS') {
        return <Badge className="bg-blue-500">In Progress</Badge>;
      }
      if (workState === 'DONE') {
        return <Badge variant="success">Done</Badge>;
      }
      return null;
    },
  },
  {
    accessorKey: 'assignedTo',
    header: 'Assignee',
    cell: ({ row }) => {
      const assignedTo = row.original.assignedTo;
      const currentUserId = 'u0000000-0000-0000-0000-000000000001'; // Demo: will come from auth
      
      if (!assignedTo) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      
      const isMe = assignedTo.id === currentUserId;
      
      return (
        <div className="text-sm">
          {isMe ? (
            <Badge variant="secondary">Me</Badge>
          ) : (
            <span className="text-foreground">{assignedTo.name || assignedTo.email}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'buyerTotalAmount',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Buyer Paid
          {isSorted === 'asc' && <ArrowUp className="size-4" />}
          {isSorted === 'desc' && <ArrowDown className="size-4" />}
          {!isSorted && <ArrowUpDown className="size-4 opacity-50" />}
        </button>
      );
    },
    cell: ({ row }) => {
      return (
        <span className="text-foreground font-medium">
          {formatPrice(row.original.buyerTotalAmount, row.original.currency)}
        </span>
      );
    },
  },
  {
    accessorKey: 'basePriceAmount',
    header: 'You Receive',
    cell: ({ row }) => {
      return (
        <span className="text-foreground font-medium">
          {formatPrice(row.original.basePriceAmount, row.original.currency)}
        </span>
      );
    },
  },
  {
    accessorKey: 'paidAt',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Paid At
          {isSorted === 'asc' && <ArrowUp className="size-4" />}
          {isSorted === 'desc' && <ArrowDown className="size-4" />}
          {!isSorted && <ArrowUpDown className="size-4 opacity-50" />}
        </button>
      );
    },
    cell: ({ row }) => {
      return (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.paidAt)}
        </span>
      );
    },
  },
];
