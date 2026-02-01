"use client"

import * as React from "react"
import { Card } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"

interface DeliveryTypeCardProps {
  title: string
  description: string
  icon: React.ReactNode
  badge: string
  badgeIcon: React.ReactNode
  selected: boolean
  disabled: boolean
  loading: boolean
  onSelect: () => void
}

export function DeliveryTypeCard({
  title,
  description,
  icon,
  badge,
  badgeIcon,
  selected,
  disabled,
  loading,
  onSelect,
}: DeliveryTypeCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <Card
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative p-8 transition-all cursor-pointer",
        "border-2 hover:shadow-lg",
        selected
          ? "border-primary ring-2 ring-ring bg-accent/50"
          : "border-border hover:border-accent-foreground/20",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-foreground">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {description}
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            {badgeIcon}
            {badge}
          </div>
        </div>
      </div>
      {loading && (
        <div className="absolute inset-0 bg-background/75 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="flex items-center gap-2 text-foreground">
            <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Creating draft...</span>
          </div>
        </div>
      )}
    </Card>
  )
}
