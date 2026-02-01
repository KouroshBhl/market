"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@workspace/contracts"
import { Badge, Button } from "@workspace/ui"
import { formatDistanceToNow } from "date-fns"

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string | null
      return (
        <div className="font-medium">
          {title || <span className="text-muted-foreground italic">No title</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string | undefined
      if (!status) return <span className="text-muted-foreground text-xs">-</span>
      
      return (
        <Badge variant={status === "DRAFT" ? "warning" : "success"}>
          {status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (value === "ALL") return true
      return row.getValue(id) === value
    },
  },
  {
    accessorKey: "deliveryType",
    header: "Delivery",
    cell: ({ row }) => {
      const deliveryType = row.getValue("deliveryType") as string | undefined
      if (!deliveryType) return <span className="text-muted-foreground text-xs">-</span>
      
      return (
        <Badge variant="outline">
          {deliveryType === "AUTO_KEY" ? "🔑 Auto" : "👤 Manual"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "basePrice",
    header: "Price",
    cell: ({ row }) => {
      const basePrice = row.getValue("basePrice") as number | null
      const baseCurrency = row.original.baseCurrency
      
      if (basePrice === null || !baseCurrency) {
        return <span className="text-muted-foreground text-xs">No price</span>
      }
      
      return (
        <div className="font-medium">
          {(basePrice / 100).toFixed(2)} {baseCurrency}
        </div>
      )
    },
  },
  {
    accessorKey: "displayCurrency",
    header: "Display",
    cell: ({ row }) => {
      const displayCurrency = row.getValue("displayCurrency") as string | null
      return displayCurrency ? (
        <span className="text-sm text-muted-foreground">{displayCurrency}</span>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      )
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as string
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original
      const previewUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/products/${product.id}/preview?sellerKey=dev-seller`
      
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(previewUrl, '_blank')}
          >
            Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alert(`Edit product: ${product.id}`)}
          >
            Edit
          </Button>
        </div>
      )
    },
  },
]
