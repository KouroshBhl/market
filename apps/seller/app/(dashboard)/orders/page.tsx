'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  Alert,
  AlertDescription,
} from '@workspace/ui';
import { columns, type OrderRow } from './orders.columns';

const DEMO_SELLER_ID = '00000000-0000-0000-0000-000000000001';

type FilterTab = 'all' | 'unassigned' | 'needsFulfillment' | 'fulfilled' | 'overdue';

interface OrdersResponse {
  items: OrderRow[];
  nextCursor: string | null;
  counts: {
    all: number;
    unassigned: number;
    needsFulfillment: number;
    fulfilled: number;
    overdue: number;
  };
}

export default function OrdersPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'paidAt', desc: true }]);
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Convert TanStack Table sorting to API sort format
  const sortParam = useMemo(() => {
    if (sorting.length === 0) return 'paidAt_desc';
    const sort = sorting[0];
    return `${sort.id}_${sort.desc ? 'desc' : 'asc'}`;
  }, [sorting]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['seller-orders', DEMO_SELLER_ID, filterTab, sortParam],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        sellerId: DEMO_SELLER_ID,
        limit: '20',
        sort: sortParam,
        filterTab,
      });
      if (pageParam) {
        params.append('cursor', pageParam);
      }
      const response = await fetch(
        `http://localhost:4000/orders/seller?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json() as Promise<OrdersResponse>;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  // Flatten all pages into single array
  const orders = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) || [];
  }, [data]);

  // Get counts from first page
  const counts = data?.pages[0]?.counts || {
    all: 0,
    unassigned: 0,
    needsFulfillment: 0,
    fulfilled: 0,
    overdue: 0,
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualSorting: true, // We handle sorting via API
  });

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Orders</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Loading state */}
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Orders</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Error state */}
        <div className="p-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load orders. {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Orders</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
        {/* Title */}
        <div>
          <h1 className="text-foreground text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage and fulfill your customer orders
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filterTab === 'all'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilterTab('unassigned')}
            className={`px-4 py-2 font-medium transition-colors ${
              filterTab === 'unassigned'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unassigned ({counts.unassigned})
          </button>
          <button
            onClick={() => setFilterTab('needsFulfillment')}
            className={`px-4 py-2 font-medium transition-colors ${
              filterTab === 'needsFulfillment'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Needs Fulfillment ({counts.needsFulfillment})
          </button>
          <button
            onClick={() => setFilterTab('fulfilled')}
            className={`px-4 py-2 font-medium transition-colors ${
              filterTab === 'fulfilled'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Fulfilled ({counts.fulfilled})
          </button>
          <button
            onClick={() => setFilterTab('overdue')}
            className={`px-4 py-2 font-medium transition-colors ${
              filterTab === 'overdue'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overdue ({counts.overdue})
          </button>
        </div>

        {/* Orders Table */}
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <span className="text-muted-foreground">No orders found</span>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
          
          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="p-4 text-center">
              {isFetchingNextPage ? (
                <span className="text-muted-foreground text-sm">Loading more...</span>
              ) : (
                <span className="text-muted-foreground text-sm">Scroll for more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
