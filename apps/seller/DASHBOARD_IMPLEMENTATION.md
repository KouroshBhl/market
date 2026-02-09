# Seller Portal Dashboard Implementation

## Overview

Implemented a comprehensive Seller Overview Dashboard at the root route (`/`) of the seller app. The dashboard provides sellers with instant understanding of their tier status, limits, bond, and next steps.

## Files Created

### Core Files

- `app/page.tsx` - Main dashboard page component
- `app/mockSellerState.ts` - Mock seller state definitions and presets
- `app/mockData.ts` - Mock offers and orders data
- `app/offers.columns.tsx` - TanStack Table column definitions for offers
- `app/orders.columns.tsx` - TanStack Table column definitions for orders

## Features Implemented

### A) Top Status Strip (4 Cards)

1. **Tier Card**
   - Shows current tier (0, 1, or 2)
   - Tier name and description
   - Color-coded badge (secondary/warning/success)

2. **Limits Card**
   - Active offers limit
   - Active orders limit
   - Payout daily cap
   - Payout delay (hours)

3. **Bond Card**
   - Bond amount ($25 USDT)
   - Bond status (LOCKED/RELEASED/SLASHED)
   - Release conditions summary
   - Slash reason if applicable

4. **Risk Card**
   - Open disputes count
   - Successful orders count
   - Risk warnings

### B) What to Do Next (Primary CTA)

Dynamic content based on tier:

- **Tier 0 (No Bond)**: CTA to pay $25 USDT bond
- **Tier 0 (Bond Paid)**: CTA to create first offer
- **Tier 1**: Progress bar showing path to Tier 2 (10 orders OR 14 days)
- **Tier 2**: Success message + links to manage offers/orders

### C) Tabs Section

#### 1. Offers Tab

- Table showing all offers
- Columns: Title, Delivery Type, Status, Stock, Price
- Active offers usage indicator (X / limit)
- "Add Offer" button
- Empty state when no offers

#### 2. Orders Tab

- Table showing all orders
- Columns: Order ID, Status, Due/Overdue, Assigned, Amount, Paid At
- Rows are clickable (hover effect)
- Overdue badges for manual orders
- Empty state when no orders

#### 3. Payout & Bond Tab

- Payout settings explanation (delay, cap)
- Bond release timeline (vertical steps):
  - Bond Paid
  - First Paid Order
  - 10 Orders OR 14 Days
  - Bond Released
- Visual progress indicators
- Alert for slashed bonds

### D) How It Works FAQ (Accordion)

6 collapsible items:

1. What is the bond?
2. When do I get my bond back?
3. What upgrades my tier?
4. What can get me banned?
5. Why are limits applied?
6. How do payouts work?

### E) Mock State Preview

Dropdown in header to switch between:

- Tier 0 Preview
- Tier 1 Preview
- Tier 2 Preview

Allows testing all UI states without backend.

## UI/UX Compliance

### Semantic Tokens Only

✅ All colors use semantic tokens:

- `bg-background`, `bg-card`, `bg-muted`, `bg-accent`
- `text-foreground`, `text-muted-foreground`
- `border-border`
- Badge variants: `success`, `warning`, `destructive`, `secondary`, `outline`

### Components from @workspace/ui

✅ All UI components imported from `@workspace/ui`:

- Button, Card, Badge, Alert
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Tabs, TabsContent, TabsList, TabsTrigger
- Accordion, AccordionContent, AccordionItem, AccordionTrigger
- Progress, Select, Separator

### No Raw HTML Elements

✅ No raw `<button>`, `<input>`, `<select>`, etc.

### Accessibility

✅ Keyboard navigation supported
✅ Proper semantic HTML structure
✅ Table rows have hover states and click handlers

### Responsive

✅ Grid layout adapts to screen size (1 col mobile, 2 cols tablet, 4 cols desktop)
✅ Tables scroll horizontally on small screens

## Data Flow

### Mock State Management

- Component-level state using `useState`
- Preset states for Tier 0, 1, 2
- No global state or React Query needed (UI-only)

### Tables

- TanStack Table for client-side rendering
- Column definitions in separate files
- No server-side pagination (mock data only)

## Microcopy & Clarity

### Seller-Friendly Language

✅ Avoids jargon like "Sybil"
✅ Uses concrete examples ("If you sell $20 USDT...")
✅ Clear explanations of what's blocked and why
✅ Exact rules to unblock features

### Examples in Copy

- "Payouts appear 48 hours after order completion"
- "Complete 10 successful orders OR maintain 14 clean days"
- "You can withdraw up to $500 USDT per day"

## Visual Style

### Minimal, Modern Dashboard

✅ Clean card-based layout
✅ Consistent spacing and typography
✅ Badge variants for status indicators
✅ Progress bars for tier advancement
✅ Timeline component for bond release

### Dark Mode Ready

✅ All semantic tokens work in both light and dark mode
✅ No hardcoded colors that break in dark mode

## Testing

### Manual Testing

- Dev server runs successfully on port 3002
- No linter errors in new files
- Page loads without errors (GET / 200)
- Hot reload works

### Linter Compliance

✅ No hardcoded colors
✅ No raw HTML elements
✅ No `any` types (fixed with `as const`)
✅ All imports from `@workspace/ui`

## Next Steps (Not Implemented - Out of Scope)

The following were explicitly excluded per requirements:

- Backend API integration
- Real data fetching with React Query
- Database changes
- Auth changes
- Real bond payment flow
- Real tier upgrade logic

## Summary

The Seller Portal home page successfully answers the 5 key questions in <10 seconds:

1. ✅ What tier am I in? (Top status strip - Tier Card)
2. ✅ What can I do right now? (Limits Card + Tabs)
3. ✅ What is blocked and why? (Limits Card + What to Do Next)
4. ✅ What do I need to unlock more? (What to Do Next + Progress Bar)
5. ✅ What happens to my bond? (Bond Card + Payout & Bond Tab + Timeline)

The implementation is UI-only, uses mocked data, follows all strict UI rules, and provides a complete seller onboarding experience.
