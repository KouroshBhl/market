# Seller Dashboard Verification Checklist

## How to Test

1. Navigate to http://localhost:3002 in your browser
2. Use the "Preview State" dropdown in the header to switch between tiers

## Visual Verification

### Header

- [ ] Sidebar trigger button visible
- [ ] Breadcrumb shows "Dashboard"
- [ ] "Preview State" dropdown in top-right (Tier 0/1/2 options)

### Page Title

- [ ] "Seller Overview" heading
- [ ] Subtitle: "Your tier, limits, bond status, and next steps"

### A) Top Status Strip (4 Cards in Grid)

#### Card 1: Tier Card

- [ ] Shows "Your Tier" label
- [ ] Displays tier badge (Tier 0/1/2)
- [ ] Shows tier name (e.g., "Tier 1: Verified Seller")
- [ ] Shows tier description

#### Card 2: Limits Card

- [ ] Shows "Limits" label
- [ ] Displays offers limit
- [ ] Displays orders limit
- [ ] Displays payout cap
- [ ] Displays payout delay

#### Card 3: Bond Card

- [ ] Shows "Bond" label
- [ ] Displays bond amount or "Not Paid"
- [ ] Shows bond status badge (LOCKED/RELEASED/SLASHED)
- [ ] Shows release conditions text

#### Card 4: Risk Card

- [ ] Shows "Risk" label
- [ ] Displays open disputes count (red if > 0)
- [ ] Displays orders completed count
- [ ] Shows warning text if tier < 2

### B) What to Do Next Card

#### Tier 0 (No Bond)

- [ ] Shows "Pay a $25 USDT bond..." message
- [ ] Shows "Pay $25 USDT Bond" button

#### Tier 0 (Bond Paid)

- [ ] Shows "Your bond is paid..." message
- [ ] Shows "Create Your First Offer" button

#### Tier 1

- [ ] Shows "Complete 10 successful orders..." message
- [ ] Shows progress bar
- [ ] Shows "X / 10 orders" and "X / 14 days" below progress bar

#### Tier 2

- [ ] Shows success alert "You are fully unlocked!"
- [ ] Shows "Manage Offers" and "View Orders" buttons

### C) Tabs Section

#### Tab Navigation

- [ ] Three tabs visible: "Offers", "Orders", "Payout & Bond"
- [ ] Active tab highlighted

#### Offers Tab

- [ ] Shows "Your Offers" heading
- [ ] Shows "Active offers: X / limit" text
- [ ] Shows "Add Offer" button
- [ ] Table with columns: Title, Delivery, Status, Stock, Price
- [ ] Mock offers displayed with correct data
- [ ] Badges show correct colors (active=success, draft=secondary, inactive=outline)
- [ ] Stock status badges (In Stock=success, Low=warning, Out=destructive)
- [ ] Empty state if no offers

#### Orders Tab

- [ ] Shows "Your Orders" heading
- [ ] Shows "Active orders: X / limit" text
- [ ] Table with columns: Order ID, Status, Due/Overdue, Assigned, Amount, Paid At
- [ ] Mock orders displayed
- [ ] Overdue badge shows for overdue orders (red)
- [ ] Status badges show correct colors
- [ ] Rows have hover effect (cursor pointer, background change)
- [ ] Empty state if no orders

#### Payout & Bond Tab

- [ ] Shows "Payout & Bond Explained" heading
- [ ] Payout settings section with delay and cap info
- [ ] Bond release timeline with 4 steps:
  1. Bond Paid (filled if paid)
  2. First Paid Order (filled if orders > 0)
  3. 10 Orders OR 14 Days (filled if tier 2)
  4. Bond Released (filled if status = RELEASED)
- [ ] Timeline has vertical line connecting steps
- [ ] Active steps have colored circles
- [ ] Inactive steps have muted circles
- [ ] Alert shows if bond is SLASHED

### D) How It Works FAQ (Accordion)

- [ ] Shows "How It Works" heading
- [ ] 6 accordion items visible:
  1. What is the bond?
  2. When do I get my bond back?
  3. What upgrades my tier?
  4. What can get me banned?
  5. Why are limits applied?
  6. How do payouts work?
- [ ] Items expand/collapse on click
- [ ] Content is readable and clear

## Functional Testing

### State Switching

- [ ] Select "Tier 0 Preview" - UI updates to show Tier 0 state
- [ ] Select "Tier 1 Preview" - UI updates to show Tier 1 state
- [ ] Select "Tier 2 Preview" - UI updates to show Tier 2 state

### Tier 0 State

- [ ] Tier badge shows "Tier 0"
- [ ] Limits are restrictive (1 offer, 3 orders, $100 cap, 72h delay)
- [ ] Bond shows "Not Paid"
- [ ] "What to do next" shows bond payment CTA

### Tier 1 State

- [ ] Tier badge shows "Tier 1"
- [ ] Limits are moderate (5 offers, 10 orders, $500 cap, 48h delay)
- [ ] Bond shows "$25 USDT" with "LOCKED" status
- [ ] "What to do next" shows progress bar
- [ ] Progress bar reflects order count and days

### Tier 2 State

- [ ] Tier badge shows "Tier 2"
- [ ] Limits show "Unlimited"
- [ ] Bond shows "RELEASED" status
- [ ] "What to do next" shows success message

## Responsive Design

- [ ] On desktop (>1024px): 4 cards in status strip
- [ ] On tablet (768-1024px): 2 cards per row
- [ ] On mobile (<768px): 1 card per row
- [ ] Tables scroll horizontally on small screens

## Accessibility

- [ ] All interactive elements keyboard accessible
- [ ] Tab navigation works through all controls
- [ ] Accordion items can be opened with Enter/Space
- [ ] Table rows can be focused

## Theme Compliance

- [ ] No hardcoded colors visible in inspector
- [ ] All colors use CSS variables (--background, --foreground, etc.)
- [ ] Page looks good in light mode
- [ ] Page looks good in dark mode (if enabled)

## Performance

- [ ] Page loads quickly (<2s)
- [ ] No console errors
- [ ] No React warnings
- [ ] Smooth transitions and interactions

## Linter Compliance

Run: `pnpm --filter seller lint`

- [ ] No errors
- [ ] No warnings in new files (page.tsx, mockSellerState.ts, mockData.ts, \*.columns.tsx)

## Browser Testing

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

## Summary

If all checkboxes are checked, the Seller Dashboard is complete and ready for production!
