"use client"

import { ColumnDef } from "@tanstack/react-table"
import { OfferWithDetails } from "@workspace/contracts"
import { Badge, Switch } from "@workspace/ui"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@workspace/ui"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const columns: ColumnDef<OfferWithDetails>[] = [
  {
    id: "active",
    header: "Active",
    cell: ({ row }) => {
      const offer = row.original
      const isActive = offer.status === 'active'
      const isDraft = offer.status === 'draft'
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={isActive}
            disabled={isDraft}
            onCheckedChange={async (checked) => {
              const newStatus = checked ? 'active' : 'inactive'
              try {
                const response = await fetch(`${API_URL}/offers/${offer.id}/status`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: newStatus }),
                })
                if (response.ok) {
                  toast({
                    title: "✓ Success",
                    description: `Offer ${checked ? 'activated' : 'deactivated'} successfully`,
                    variant: "success",
                  })
                  setTimeout(() => window.location.reload(), 1000)
                } else {
                  const errorData = await response.json()
                  toast({
                    title: "✕ Error",
                    description: errorData.message || 'Failed to update status',
                    variant: "destructive",
                  })
                }
              } catch (err) {
                toast({
                  title: "✕ Error",
                  description: 'An error occurred while updating status',
                  variant: "destructive",
                })
              }
            }}
          />
        </div>
      )
    },
  },
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => {
      const offer = row.original
      const productName = offer.variant?.product?.name
      const variantRegion = offer.variant?.region
      const variantDuration = offer.variant?.durationDays
      const variantEdition = offer.variant?.edition
      
      return (
        <div>
          <div className="font-medium">
            {productName || <span className="text-muted-foreground italic">Unknown product</span>}
          </div>
          <div className="text-xs text-muted-foreground flex gap-1 mt-1">
            {variantRegion && <Badge variant="outline" className="text-xs">{variantRegion}</Badge>}
            {variantDuration && <Badge variant="outline" className="text-xs">{variantDuration} days</Badge>}
            {variantEdition && <Badge variant="outline" className="text-xs">{variantEdition}</Badge>}
          </div>
        </div>
      )
    },
    filterFn: (row, columnId, filterValue) => {
      const offer = row.original
      const productName = offer.variant?.product?.name || ""
      return productName.toLowerCase().includes(filterValue.toLowerCase())
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string | undefined
      if (!status) return <span className="text-muted-foreground text-xs">-</span>
      
      const variant = status === "draft" ? "warning" : status === "active" ? "success" : "secondary"
      
      return (
        <Badge variant={variant}>
          {status.toUpperCase()}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (value === "ALL") return true
      const status = row.getValue(id) as string
      return status === value
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
    id: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const offer = row.original
      
      // Only show stock info for AUTO_KEY offers
      if (offer.deliveryType !== "AUTO_KEY") {
        return <span className="text-muted-foreground text-xs">N/A</span>
      }
      
      const availableCount = offer.autoKeyAvailableCount ?? 0
      const availability = offer.availability
      
      if (availability === "out_of_stock" || availableCount === 0) {
        return (
          <Badge variant="destructive" className="text-xs">
            Out of Stock
          </Badge>
        )
      }
      
      return (
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs">
            In Stock
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({availableCount} keys)
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "priceAmount",
    header: "Price",
    cell: ({ row }) => {
      const priceAmount = row.getValue("priceAmount") as number | null
      const currency = row.original.currency
      
      if (priceAmount === null || !currency) {
        return <span className="text-muted-foreground text-xs">No price</span>
      }
      
      return (
        <div className="font-medium">
          {(priceAmount / 100).toFixed(2)} {currency}
        </div>
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
]
