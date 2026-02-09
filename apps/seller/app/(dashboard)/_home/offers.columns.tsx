"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui";
import type { MockOffer } from "./mockData";

export const offersColumns: ColumnDef<MockOffer>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {row.original.title}
      </span>
    ),
  },
  {
    accessorKey: "deliveryType",
    header: "Delivery",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.deliveryType === "AUTO_KEY" ? "Auto Key" : "Manual"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      const variant =
        s === "active" ? "success" : s === "draft" ? "warning" : "secondary";
      return <Badge variant={variant}>{s.toUpperCase()}</Badge>;
    },
  },
  {
    id: "stock",
    header: "Stock / Keys",
    cell: ({ row }) => {
      const label = row.original.stockLabel;
      if (label === "Out of stock") {
        return <Badge variant="destructive">Out of stock</Badge>;
      }
      if (label === "N/A") {
        return (
          <span className="text-muted-foreground text-sm">N/A</span>
        );
      }
      return (
        <span className="text-sm text-foreground">{label}</span>
      );
    },
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) => {
      const cents = row.original.priceAmount;
      return (
        <span className="font-medium text-foreground">
          {(cents / 100).toFixed(2)} {row.original.currency}
        </span>
      );
    },
  },
];
