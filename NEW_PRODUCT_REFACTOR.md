# New Product Page Refactor - Theme Token Migration

## Files Changed

### Created:
1. **`apps/seller/components/delivery-type-card.tsx`**
   - Reusable delivery type selection card component
   - Uses only theme tokens (bg-card, border-border, ring-ring, text-foreground, etc.)
   - Proper button semantics with aria-pressed and keyboard support
   - Loading overlay with backdrop-blur

2. **`packages/ui/src/components/alert.tsx`**
   - Shadcn Alert component with destructive variant
   - Token-based styling (border-destructive, text-destructive)
   - Exported from @workspace/ui

### Modified:
3. **`apps/seller/app/products/new/page.tsx`**
   - Removed ALL hardcoded colors (bg-gray-50, text-blue-600, bg-red-50, etc.)
   - Uses DeliveryTypeCard component
   - Uses Alert component for errors
   - Added breadcrumb navigation and header
   - All styling uses theme tokens

4. **`apps/seller/app/products/[id]/next-step/page.tsx`**
   - Removed hardcoded colors (bg-gray-50/600/700/900, bg-green-100, text-green-600, bg-blue-50, border-blue-200)
   - Uses Alert component instead of custom info box
   - Added breadcrumb navigation and header (consistent with other pages)
   - All styling uses theme tokens (bg-accent, text-accent-foreground, text-muted-foreground)

5. **`packages/ui/src/index.ts`**
   - Added Alert component export

## Token Usage Summary

**Removed hardcoded colors:**
- bg-gray-50/900, text-gray-600/900, border-gray-300
- bg-blue-100, text-blue-600, border-blue-500, ring-blue-100
- bg-green-100, text-green-600, border-green-500, ring-green-100
- bg-red-50, border-red-300, text-red-800

**Replaced with theme tokens:**
- bg-background, bg-card, bg-muted, bg-accent/50
- text-foreground, text-muted-foreground
- border-border, border-primary, border-accent-foreground/20
- ring-ring (for focus/selected states)
- border-destructive, text-destructive (for errors)

**Result:** Fully dark-mode compatible, consistent with shared design system, zero hardcoded colors.
