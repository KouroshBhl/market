"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "@workspace/ui";
import { AlertCircle } from "lucide-react";
import type { MockOrder, MockOrderStatus } from "./mockData";

function statusBadge(status: MockOrderStatus) {
  switch (status) {
    case "PENDING_PAYMENT":
      return <Badge variant="secondary">Pending</Badge>;
    case "PAID":
      return <Badge variant="default">Paid</Badge>;
    case "FULFILLED":
      return <Badge variant="success">Fulfilled</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Cancelled</Badge>;
    case "EXPIRED":
      return <Badge variant="secondary">Expired</Badge>;
  }
}

export const ordersColumns: ColumnDef<MockOrder>[] = [
  {
    accessorKey: "displayId",
    header: "Order",
    cell: ({ row }) => (
      <Button variant="link" className="p-0 h-auto font-mono text-sm">
        {row.original.displayId}
      </Button>
    ),
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => (
      <span className="text-foreground text-sm">{row.original.productName}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="flex items-center gap-2">
          {statusBadge(order.status)}
          {order.isOverdue && (
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
    id: "due",
    header: "Due / Overdue",
    cell: ({ row }) => (
      <span
        className={
          row.original.isOverdue
            ? "text-destructive text-sm font-medium"
            : "text-muted-foreground text-sm"
        }
      >
        {row.original.dueLabel}
      </span>
    ),
  },
  {
    id: "assigned",
    header: "Assigned",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.assignedTo ?? "—"}
      </span>
    ),
  },
  {
    id: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {(row.original.amount / 100).toFixed(2)} {row.original.currency}
      </span>
    ),
  },
];
