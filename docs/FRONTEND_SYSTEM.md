# FRONTEND SYSTEM

Single source of truth for design system, UI components, styling rules, and frontend conventions.

---

## Component Rules (STRICT)

### Always Import from @workspace/ui

```typescript
import {
  Button,
  Input,
  Select,
  Textarea,
  Label,
  Card,
  Badge,
  Alert,
} from '@workspace/ui';
```

### FORBIDDEN Raw Elements

ESLint will error on these in app code:

- `<button>` → Use `<Button>`
- `<input>` → Use `<Input>`
- `<select>` → Use `<Select>`
- `<textarea>` → Use `<Textarea>`

### FORBIDDEN Deep Imports

```typescript
// ❌ WRONG
import { Button } from '@workspace/ui/components/button';

// ✅ CORRECT
import { Button } from '@workspace/ui';
```

---

## Theme Token Rules (STRICT)

### FORBIDDEN: Hardcoded Tailwind Colors

ESLint rule `no-hardcoded-colors` blocks these patterns:

```
bg-(color)-(shade)      e.g., bg-blue-500, bg-gray-100
text-(color)-(shade)    e.g., text-red-600, text-gray-900
border-(color)-(shade)  e.g., border-green-300
ring-(color)-(shade)    e.g., ring-blue-500
from-*, via-*, to-*     gradients
```

Colors blocked: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose

### ALLOWED: Semantic Theme Tokens

| Category        | Tokens                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backgrounds** | `bg-background`, `bg-card`, `bg-muted`, `bg-accent`, `bg-primary`, `bg-secondary`, `bg-destructive`                                                |
| **Text**        | `text-foreground`, `text-muted-foreground`, `text-primary-foreground`, `text-accent-foreground`, `text-destructive`, `text-destructive-foreground` |
| **Borders**     | `border-border`, `border-input`, `border-ring`, `border-primary`, `border-destructive`                                                             |
| **Rings**       | `ring-ring`, `ring-offset-background`                                                                                                              |

### Migration Examples

```tsx
// ❌ Before
<div className="bg-gray-50 text-gray-900">
<p className="text-gray-600">
<button className="bg-blue-500 text-white">
<div className="bg-red-50 border-red-300 text-red-800">

// ✅ After
<div className="bg-background text-foreground">
<p className="text-muted-foreground">
<Button>  // uses primary by default
<Alert variant="destructive">
```

---

## Component Variants

### Button

```tsx
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="link">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Badge

```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
```

### Alert

```tsx
<Alert>Default info alert</Alert>
<Alert variant="destructive">
  <AlertDescription>Error message</AlertDescription>
</Alert>
```

---

## Form Patterns

### Standard Form Field

```tsx
import { Button, Input, Label } from '@workspace/ui';

<div className='space-y-2'>
  <Label htmlFor='email'>Email *</Label>
  <Input
    id='email'
    type='email'
    required
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder='Enter email'
  />
</div>;
```

### Card Container

```tsx
import { Card } from '@workspace/ui';

<Card className='p-6 border-2'>
  <h3 className='text-foreground'>Title</h3>
  <p className='text-muted-foreground'>Description</p>
</Card>;
```

---

## Layout Classes (Allowed)

These non-color utilities are fine on any element:

- Spacing: `p-4`, `m-2`, `mt-4`, `mb-2`, `space-y-4`, `gap-2`
- Size: `w-full`, `h-full`, `max-w-md`
- Layout: `flex`, `grid`, `items-center`, `justify-between`
- Typography: `font-bold`, `text-sm`, `text-lg`
- Borders: `rounded-lg`, `border-2` (without color)

---

## State Patterns

### Loading State

```tsx
{
  isLoading && <Spinner />;
}
```

### Error State

```tsx
<Alert variant='destructive'>
  <AlertDescription>{error.message}</AlertDescription>
  <Button variant='outline' onClick={retry}>
    Retry
  </Button>
</Alert>
```

### Empty State

```tsx
<div className='text-center text-muted-foreground py-8'>No items found</div>
```

---

## React Query Setup

### Provider Location

- Place `QueryProvider` in dashboard layout, not root
- Avoid provider in every page

### Query Keys

```typescript
// Stable, predictable keys
['products'][('product', productId)][('offers', { sellerId })];
```

### Mutations

```typescript
// Always invalidate related queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['products'] });
};
```

---

## TanStack Table Conventions

### Column Definitions

- Separate file: `*.columns.tsx`
- Keep table state separate from server state
- MVP: Client-side only (server-side later if needed)

```tsx
// products.columns.tsx
export const columns: ColumnDef<Product>[] = [
  { accessorKey: 'title', header: 'Title' },
  {
    accessorKey: 'status',
    cell: ({ row }) => <Badge>{row.getValue('status')}</Badge>,
  },
];
```

---

## Accessibility Requirements

- Interactive elements MUST be keyboard accessible
- Use proper ARIA roles when applicable
- **FORBIDDEN**: `<div role="button">` — use real `<Button>`
- Use `<Label htmlFor={id}>` with form inputs
- Focus management for modals and dialogs

---

## Dark Mode Strategy

### Current State

- Theme tokens defined in `packages/ui/src/styles/globals.css`
- Light mode implemented
- Dark mode ready (CSS variables switch automatically)

### Implementation

- All components use CSS variables (not hardcoded colors)
- Theme tokens work in both modes
- No additional work needed when dark mode is enabled

---

## Adding New Components

### From shadcn

```bash
pnpm dlx shadcn@latest add <component-name> -c apps/seller
# Components auto-placed in packages/ui/src/components/
```

### Export from Package

```typescript
// packages/ui/src/index.ts
export { NewComponent } from './components/new-component';
```

### Usage

```typescript
import { NewComponent } from '@workspace/ui';
```

---

## ESLint Rules Summary

| Rule                   | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `no-hardcoded-colors`  | Prevents hardcoded Tailwind color classes |
| `no-restricted-syntax` | Prevents raw `<button>`, `<input>`, etc.  |

### Check Compliance

```bash
# Check specific app
pnpm --filter seller lint

# Check all apps for UI violations
pnpm -w lint:ui
```

---

## Available Components

From `@workspace/ui`:

| Component | Usage                         |
| --------- | ----------------------------- |
| Button    | Buttons with variants         |
| Input     | Text, number, email, password |
| Select    | Dropdown selects              |
| Textarea  | Multi-line text               |
| Label     | Form labels                   |
| Card      | Container cards               |
| Badge     | Status badges                 |
| Alert     | Alert messages                |
| Dialog    | Modal dialogs                 |
| Switch    | Toggle switches               |
| Table     | Data tables                   |
| Toast     | Notifications                 |

---

## Quick Reference

### DO

- Import all UI from `@workspace/ui`
- Use semantic tokens (`bg-background`, `text-foreground`)
- Use component variants over custom classes
- Provide loading, error, and empty states
- Make interactive elements keyboard accessible

### DO NOT

- Use raw HTML form elements in apps
- Use hardcoded Tailwind colors
- Deep import from UI package internals
- Skip loading/error states
- Use `<div role="button">`

---

# BUYER WEB APP — UX BLUEPRINT

Single source of truth for the buyer-facing storefront (`apps/web`) UX structure, information architecture, and design decisions. This document covers the **Global Shell** (Header + Footer) and **Product Page** (`/p/[productSlug]`). Implementation follows this spec exactly.

---

## Design Philosophy

The buyer web app is a **storefront**, not a dashboard. Every decision optimizes for:

1. **SEO**: Server-rendered content, semantic HTML, structured data, crawlable links
2. **Trust**: First-time buyers on a marketplace need repeated reassurance
3. **Conversion**: Minimize friction between "I want this" and "I bought it"
4. **Clarity**: Digital goods + multiple sellers + delivery types = complexity that must be hidden behind simplicity

**Key principle**: The seller dashboard is a *tool*. The buyer storefront is a *shop*. Different mental models require different UX patterns.

---

## SEO Architecture (NON-NEGOTIABLE)

### Rendering Strategy

- All public pages are **Server Components** by default (Next.js App Router)
- Interactive islands (variant selector, offer sorting) use `"use client"` at the component boundary, not the page level
- The page shell, product content, and offer list are server-rendered HTML
- Client components hydrate on top for interactivity

### URL Strategy

| Route | Purpose | Index |
|-------|---------|-------|
| `/` | Home page | index |
| `/c/[parentSlug]` | Category listing (parent) | index |
| `/c/[parentSlug]/[childSlug]` | Category listing (child) | index |
| `/p/[productSlug]` | Product detail page | index |
| `/search?q=...` | Search results | noindex |
| `/cart` | Shopping cart | noindex |
| `/checkout/*` | Checkout flow | noindex |
| `/orders/*` | Order history/detail | noindex |
| `/account/*` | Account settings | noindex |
| `/auth/*` | Login/register | noindex |

**Rules**:
- Public catalog pages = **index, follow**
- Transactional/authenticated pages = **noindex, nofollow**
- Canonical URLs always use the bare path (no query params for variants)

### Metadata Template

Every indexable page generates metadata server-side:

```
<title>{PageTitle} | {SiteName}</title>
<meta name="description" content="{unique 150-160 char description}" />
<link rel="canonical" href="https://{domain}{path}" />
<meta property="og:title" content="{PageTitle}" />
<meta property="og:description" content="{description}" />
<meta property="og:image" content="{image or default OG}" />
<meta property="og:type" content="website" /> (or "product" on product pages)
<meta property="og:url" content="{canonical}" />
<meta name="twitter:card" content="summary_large_image" />
```

### Semantic HTML Hierarchy

Every page follows strict heading hierarchy:
- **H1**: One per page, describes the primary content (product name, category name)
- **H2**: Major page sections (Offers, Description, How It Works, Related Products)
- **H3**: Subsections within H2 blocks (individual trust points, FAQ items)

No skipping levels. No decorative headings.

---

## PART 1: GLOBAL SHELL

### 1.1 Header

The header is the persistent navigation bar across all buyer pages. It must be lightweight (not block content rendering), crawlable, and responsive.

#### Desktop Header Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Logo]    [Categories v]     [─── Search ─────────────]  [👤] [🛒] │
└──────────────────────────────────────────────────────────────────────┘
```

**Element-by-element breakdown**:

| Element | Position | Behavior | Why It Exists |
|---------|----------|----------|---------------|
| **Logo** | Far left | Links to `/`. Always visible. | Brand anchor. Users expect it here. Sets trust on first impression. |
| **Categories** | Left of center | Click to open mega-menu dropdown. Contains parent categories with child categories nested. All links are `<a>` with `href`. | Primary browse entry point. SEO: crawlable internal links to category pages. Users who don't have a specific product in mind browse by category. |
| **Search Bar** | Center, expanded | Text input with placeholder "Search products...". Submit navigates to `/search?q=...`. | The #1 navigation method for returning buyers and users arriving from external search. Central placement = high visual priority. |
| **Account** | Far right | Anonymous: "Sign In" text link. Authenticated: Avatar icon with dropdown (Orders, Account, Sign Out). | Entry point to authenticated features. Minimal footprint when anonymous to avoid scaring SEO traffic away. |
| **Cart** | Far right, after Account | Icon with count badge (number of items). Links to `/cart`. Badge hidden when empty. | Persistent conversion reminder. Count badge creates urgency. Must always be one click away. |

**Categories Mega-Menu**:
- Triggered on click (not hover — hover is inaccessible on touch devices and causes accidental opens)
- Structure: Grid of parent categories, each with a list of child category links beneath
- Every link is a real `<a href="/c/parent-slug/child-slug">` (crawlable)
- Menu closes on outside click, Escape key, or navigation
- The menu is rendered in DOM (not display:none) for SEO, but visually hidden until opened via `aria-expanded`

#### Mobile Header Layout

```
┌──────────────────────────────────────┐
│  [☰]   [Logo]            [🔍] [🛒]  │
└──────────────────────────────────────┘
```

| Element | Behavior |
|---------|----------|
| **Hamburger** | Opens a slide-out drawer (Sheet from @workspace/ui). Contains: Categories (accordion by parent), Account links, Help/Support link. |
| **Logo** | Centered. Links to `/`. |
| **Search** | Tapping opens a full-width search overlay that slides down from top. Auto-focuses the input. Close on Escape or X button. |
| **Cart** | Always visible. Count badge. Links to `/cart`. |

**Why this mobile layout**:
- Hamburger left = standard mobile convention (Android/Material, most marketplaces)
- Search as icon saves horizontal space; expands when needed
- Cart is always visible because it's the conversion anchor
- Account moves into the hamburger drawer to reduce header clutter

#### Header Technical Notes

- Semantic: `<header>` element with `<nav aria-label="Main navigation">`
- Server-rendered: The header HTML is part of the root layout (server component). Interactive parts (menu open/close, search expand) are client component islands.
- Skip-to-content: Hidden-but-focusable "Skip to main content" link before the header for keyboard/screen-reader users
- Sticky: Header is `position: sticky; top: 0` with a subtle border-bottom on scroll. Does NOT use fixed positioning (avoids layout shift).
- Height: Fixed height to prevent CLS (Cumulative Layout Shift). Desktop: 64px. Mobile: 56px.

---

### 1.2 Footer

The footer serves three strategic purposes: **trust building**, **SEO link equity**, and **legal compliance**.

#### Desktop Footer Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [Marketplace]     [Browse]          [Support]       [Legal]         │
│  ─────────────     ──────────        ─────────       ──────          │
│  About Us          Games             Help Center     Terms of Service│
│  How It Works      Software          Contact Us      Privacy Policy  │
│  Sell on Market    Gift Cards        FAQ             Refund Policy   │
│                    Services          Report Issue    Cookie Policy   │
│                    Education                                         │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  (c) 2026 MarketName                              [Payment Icons]    │
└──────────────────────────────────────────────────────────────────────┘
```

**Column-by-column reasoning**:

| Column | Contents | Why |
|--------|----------|-----|
| **Marketplace** | About Us, How It Works, Sell on Market | Brand story. "How It Works" is a trust page for first-time buyers. "Sell on Market" links to seller portal (drives supply). |
| **Browse** | All 5 parent category links | SEO: Internal link equity flows from every page to category pages. Crawlers follow these links. Buyers who scroll to footer are either lost or exploring — give them browse paths. |
| **Support** | Help Center, Contact, FAQ, Report Issue | Trust signal. Presence of support links = "this is a real business that will help me if something goes wrong." Critical for first-time buyers on a marketplace. |
| **Legal** | Terms, Privacy, Refund, Cookie | Legal compliance. Refund Policy is also a trust signal ("they have a refund process"). Required for EU/GDPR compliance (privacy, cookies). |

**Bottom bar**:
- Copyright notice: Left-aligned
- Payment method icons: Right-aligned (Visa, Mastercard, etc. — trust symbols)
- Social links deferred (add when channels exist; empty social links erode trust)

#### Mobile Footer Layout

- 4 columns become **accordion sections** (collapsible)
- Each section header is a tappable row with expand/collapse chevron
- Bottom bar stacks vertically (copyright above payment icons)
- All links remain crawlable `<a>` tags even when visually collapsed

**Why accordion**: Vertical scrolling is natural on mobile. A 4-column footer would create tiny, hard-to-tap links. Accordion lets users expand only what they need.

#### Footer Technical Notes

- Semantic: `<footer>` element
- All links are `<a>` tags with descriptive text (never "Click here")
- Server-rendered entirely (zero client JS needed)
- Category links match the canonical URL pattern (`/c/[parentSlug]`)
- `rel="noopener"` on any external links

---

## PART 2: PRODUCT PAGE (`/p/[productSlug]`)

### 2.1 Page Identity and SEO

**URL**: `/p/[productSlug]`
- `/p/` prefix: Short, unambiguous, separates product pages from category pages
- `productSlug`: Unique per CatalogProduct (e.g., `minecraft-java-edition`)
- Variants do NOT change the URL. The canonical is always `/p/[productSlug]`

**Metadata** (generated server-side from CatalogProduct + Offers):

```
<title>{productName} - Buy {childCategoryName} | MarketName</title>
<meta name="description"
  content="Buy {productName} from {offerCount} trusted sellers.
  {deliveryTypeHint}. Prices from {lowestPriceFmt}." />
<link rel="canonical" href="https://{domain}/p/{productSlug}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="{productName}" />
<meta property="og:description" content="{same as description}" />
<meta property="og:image" content="{product.imageUrl or default}" />
```

Where `{deliveryTypeHint}` = "Instant delivery available" if any AUTO_KEY offer exists, else "Digital delivery".

**Structured Data (JSON-LD)** — injected in `<head>` via server component:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{productName}",
  "description": "{product.description}",
  "image": "{product.imageUrl}",
  "category": "{parentCategory} > {childCategory}",
  "sku": "{defaultVariant.sku}",
  "brand": {
    "@type": "Brand",
    "name": "MarketName"
  },
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "{lowestBuyerPrice}",
    "highPrice": "{highestBuyerPrice}",
    "priceCurrency": "USD",
    "offerCount": "{activeOfferCount}",
    "availability": "https://schema.org/InStock",
    "offers": [
      {
        "@type": "Offer",
        "price": "{buyerTotalFormatted}",
        "priceCurrency": "{currency}",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "{sellerDisplayName}"
        },
        "deliveryLeadTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": "{estimatedDeliveryMinutes or 0}",
          "unitCode": "MIN"
        }
      }
    ]
  }
}
```

Additionally, **BreadcrumbList** structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://{domain}/" },
    { "@type": "ListItem", "position": 2, "name": "{parentCategory}", "item": "https://{domain}/c/{parentSlug}" },
    { "@type": "ListItem", "position": 3, "name": "{childCategory}", "item": "https://{domain}/c/{parentSlug}/{childSlug}" },
    { "@type": "ListItem", "position": 4, "name": "{productName}" }
  ]
}
```

---

### 2.2 Page Sections — Information Hierarchy

The page is divided into sections ordered by buyer intent. A buyer arriving on this page is typically:
1. Evaluating the product (is this what I want?)
2. Comparing sellers (who should I buy from?)
3. Building trust (is this safe?)
4. Converting (add to cart / buy now)

**Section order (top to bottom)**:

| # | Section | Purpose | H-level |
|---|---------|---------|---------|
| 1 | Breadcrumb | Wayfinding + SEO | none |
| 2 | Product Hero | Identity + quick evaluation | H1 |
| 3 | Variant Selector | Narrow intent to specific SKU | none |
| 4 | Best Offer (CTA) | Primary conversion point | none |
| 5 | All Offers List | Comparison + secondary conversion | H2 |
| 6 | Product Description | Detailed product info | H2 |
| 7 | Trust and Guarantee | Reassurance for hesitant buyers | H2 |
| 8 | Related Products | Cross-sell + SEO internal links | H2 |

---

### 2.3 Section Details

#### Section 1: Breadcrumb

```
Home  >  Games  >  PC Games  >  Minecraft Java Edition
```

- Semantic: `<nav aria-label="Breadcrumb">` with `<ol>` list
- Each segment is a link except the last (current page, plain text)
- Links use canonical category URLs: `/c/games`, `/c/games/pc-games`
- Structured data: BreadcrumbList JSON-LD (see 2.1)
- **Why**: Wayfinding for users, internal link equity for SEO, breadcrumb rich snippets in Google

#### Section 2: Product Hero

**Desktop**: Two-column layout (image left, info right)

```
+------------------------+--------------------------------------+
|                        |                                      |
|   [Product Image]      |  H1: Minecraft Java Edition          |
|   (or placeholder      |                                      |
|    for digital goods)  |  <Badge>PC Games</Badge>             |
|                        |                                      |
|                        |  5 sellers  .  From $19.99            |
|                        |  (lightning) Instant delivery avail.  |
|                        |                                      |
|                        |  {Short description first 200 chars  |
|                        |   of product.description}            |
|                        |                                      |
+------------------------+--------------------------------------+
```

**Mobile**: Stacked (image on top, info below)

| Element | Details |
|---------|---------|
| **Product Image** | `CatalogProduct.imageUrl`. If null, show a styled placeholder (category icon + product name). Images use `next/image` with priority loading, proper `alt` text, and aspect ratio container to prevent CLS. |
| **H1** | The product name. One H1 per page. Large, bold. |
| **Category Badge** | Links to the child category page. Uses `<Badge variant="secondary">` as a link. Gives context and is crawlable. |
| **Quick Stats** | "{N} sellers . From {lowestPrice}". Communicates marketplace breadth and price floor immediately. User knows there are options. |
| **Delivery Hint** | If ANY offer for this product is AUTO_KEY: show "Instant delivery available" with a lightning icon. This is the single most important trust signal for digital goods. If all offers are MANUAL: omit this line (do not show negative — absence communicates). |
| **Short Description** | First ~200 characters of `CatalogProduct.description`, truncated at word boundary. Full description is below. Gives just enough info for quick evaluation. |

**Why this layout**: The hero must answer "Am I on the right page?" within 2 seconds. Product name (H1), image, and category badge do that. Quick stats and delivery hint start the comparison/trust process without requiring scroll.

#### Section 3: Variant Selector

Variants in this marketplace are defined by three axes: **Region**, **Duration**, and **Edition**. Not all products have all axes.

```
+---------------------------------------------------------+
|  Region:    [EU]  [US]  [TR]  [Global]                  |
|  Duration:  [30 Days]  [90 Days]  [1 Year]  [Lifetime]  |
|  Edition:   [Standard]  [Deluxe]  [Ultimate]            |
+---------------------------------------------------------+
```

**Behavior**:

| Aspect | Rule |
|--------|------|
| **Rendering** | Only show axes that have more than 1 option. If all variants are GLOBAL region, hide the region selector. If no duration variants, hide duration. |
| **Default selection** | Pre-select the variant combination that has the **lowest buyer price** among active offers. This is the best first impression. |
| **Style** | Segmented control / pill buttons (not dropdown). All options visible at a glance. Selected state uses `bg-primary text-primary-foreground`. Unselected uses `bg-muted text-muted-foreground`. |
| **Unavailable combos** | If a variant combination has no active offers, the pill is visually muted and shows "Unavailable" on hover/tap. Still selectable (shows "No offers" state below). Not hidden — hiding options confuses users who know what they want. |
| **URL behavior** | Variant changes do NOT change the URL. The canonical stays `/p/[productSlug]`. Variant state is client-side only. Reason: Prevents thin content issues (Google sees one canonical page, not hundreds of variant URLs). |
| **Offer list update** | Changing a variant instantly filters the offers list (Section 5) and updates the Best Offer (Section 4). No page reload. Client-side state. |

**Mobile**: Same pill buttons, but the container scrolls horizontally if options overflow.

**Why segmented control instead of dropdowns**: Digital goods typically have 2-6 variants per axis. Pill buttons show all options without extra clicks. Dropdowns hide information. Marketplaces like G2A, Eneba, and Kinguin all use visible selectors.

#### Section 4: Best Offer (Primary Conversion Point)

This is the most important section on the page. It showcases the "best" offer for the selected variant and provides the primary CTA.

**Desktop**: Part of the right column, positioned directly below the variant selector. Becomes **sticky** when the user scrolls past the hero.

```
+--------------------------------------+
|  Best Offer                          |
|                                      |
|  $20.59                              |
|  Price $19.99 + $0.60 service fee    |
|                                      |
|  (lightning) Instant Delivery        |
|  from SellerName                     |
|                                      |
|  +------------------------------+   |
|  |       Add to Cart            |   |
|  +------------------------------+   |
|                                      |
|  (check) Buyer protection included   |
|  (check) Secure payment             |
+--------------------------------------+
```

**Mobile**: Appears inline (not sticky yet — the sticky CTA is at the bottom, see Section 2.5).

**Element details**:

| Element | Details |
|---------|---------|
| **"Best Offer" label** | Communicates this is the recommended option. User can see alternatives below. |
| **Price (primary)** | The **buyer total** (`buyerTotalAmount`). Large, bold. This is what the buyer pays. |
| **Price breakdown** | Below the primary price, in `text-muted-foreground`, smaller: "Price {basePriceFormatted} + {feeFormatted} service fee". Transparent. Builds trust. Does NOT dominate the visual — the total is what matters. |
| **Delivery Type Badge** | AUTO_KEY: "Instant Delivery" with `<Badge variant="success">` and lightning icon. MANUAL: "Delivery in ~{formatted time}" with `<Badge variant="secondary">` and clock icon. This is the #2 decision factor after price for digital goods. |
| **Seller Name** | "from {sellerDisplayName}". Tappable — could link to seller profile (future). Gives human attribution. |
| **CTA Button** | "Add to Cart" — full width, primary variant, `size="lg"`. Single most important interactive element on the page. |
| **Trust Signals** | Two checkmarks: "Buyer protection included" and "Secure payment". Always visible. These are NOT links — they are reassurance. Small text, `text-muted-foreground` with check icon. |

**"Best Offer" Selection Logic**:
1. Among active offers for the selected variant
2. Prefer AUTO_KEY over MANUAL at the same price (instant delivery is more valuable)
3. If same delivery type, prefer lowest buyer price
4. Ties: Prefer seller with earliest `publishedAt` (future: most sales/highest rating)

**Sticky Behavior (Desktop)**:
- When the user scrolls past the hero area, the Best Offer box sticks to the top of the right column
- Uses `position: sticky; top: {headerHeight + gap}px`
- The sticky box maintains conversion access while the user reads offers, description, etc.
- Does NOT stick on mobile (mobile has a separate sticky bottom bar)

#### Section 5: All Offers List

This section shows every active offer for the selected variant, enabling comparison.

**Heading**: `<h2>All Offers ({count})</h2>`

**Sort Controls** (client-side):

| Sort Option | Default | Logic |
|-------------|---------|-------|
| **Price: Low to High** | Yes (default) | Sort by `buyerTotalAmount` ascending |
| **Price: High to Low** | No | Sort by `buyerTotalAmount` descending |
| **Delivery Speed** | No | AUTO_KEY first, then MANUAL sorted by `estimatedDeliveryMinutes` ascending |

**Offer Row Layout (Desktop)**:

```
+---------------------------------------------------------------------+
|  [SA]  SellerAlpha        (lightning) Instant    $20.59  [Add]      |
|        New seller                     Delivery                      |
+---------------------------------------------------------------------+
|  [DG]  DigiGoods          (clock) ~1 hour       $18.50  [Add]      |
|        New seller                  delivery                         |
+---------------------------------------------------------------------+
|  [KM]  KeyMaster          (lightning) Instant    $21.99  [Add]      |
|        New seller                     Delivery                      |
+---------------------------------------------------------------------+
```

**Offer Row Layout (Mobile)** — card-based:

```
+-------------------------------+
|  SellerName  (star) 4.8       |
|  (lightning) Instant Delivery |
|  $20.59          [Add to Cart]|
+-------------------------------+
```

**Per-offer elements**:

| Element | Source | Notes |
|---------|--------|-------|
| **Seller Avatar** | Future: `sellerProfile.avatarUrl`. Now: Initial letter avatar. | Human face/identity builds trust. |
| **Seller Name** | `sellerProfile.displayName` | Attribution. Future: links to seller page. |
| **Seller Reputation** | Future: star rating + sale count | Deferred. Design space reserved. Show placeholder text like "New Seller" until reputation system exists. |
| **Delivery Type** | `offer.deliveryType` | AUTO_KEY: `<Badge variant="success">` "Instant Delivery". MANUAL: `<Badge variant="outline">` "~{time} delivery". |
| **Price** | `buyerTotalAmount` formatted | Primary display. Buyer total only in the list view (keep it clean). |
| **CTA** | "Add to Cart" or "Add" (compact) | `<Button variant="outline">` for non-best offers. The best offer's CTA in Section 4 uses primary variant — visual differentiation so the "best" stands out. |

**Delivery Time Formatting** (for MANUAL offers):

| `estimatedDeliveryMinutes` | Display |
|----------------------------|---------|
| 1-59 | "~{N} minutes" |
| 60 | "~1 hour" |
| 61-1439 | "~{N} hours" (rounded) |
| 1440 | "~1 day" |
| 1441-10080 | "~{N} days" (rounded) |

**AUTO_KEY vs MANUAL — Visual Differentiation**:

The delivery type is the single most important differentiator between offers in a digital goods marketplace. The design communicates this through:

1. **Badge color**: AUTO_KEY uses `variant="success"` (semantic green). MANUAL uses `variant="outline"` (neutral). The color difference is immediately scannable.
2. **Icon**: AUTO_KEY gets a lightning bolt icon. MANUAL gets a clock icon. Icons reinforce meaning without requiring text reading.
3. **Language**: AUTO_KEY = "Instant Delivery" (certainty). MANUAL = "~{time} delivery" (estimate, hence the tilde).
4. **No jargon**: Buyers never see "AUTO_KEY" or "MANUAL". These are internal terms. Buyers see "Instant Delivery" or "Delivered in ~1 hour".

**SLA Communication for MANUAL Offers**:

- The estimated time is shown prominently in the offer badge
- Hovering/tapping the badge reveals a tooltip: "This seller typically delivers within {time}. You are covered by our buyer protection if delivery is late."
- The SLA is NOT an afterthought — it is a primary offer attribute displayed at the same visual level as price
- **Why surface SLA**: Buyers weighing a cheaper MANUAL offer vs. a pricier AUTO_KEY offer need the time dimension to make a rational decision. Hiding SLA would bias toward AUTO_KEY unfairly and reduce trust in MANUAL sellers.

**Price Transparency in Expanded Detail**:

Clicking/tapping an offer row optionally expands to show:
```
  Price breakdown:
  Base price:     $17.92
  Service fee:    $0.58
  You pay:        $18.50
```
This is secondary information — available for transparency but not shown by default. Keeps the comparison view clean.

**Empty State** (no offers for selected variant):

```
+-------------------------------------------------------------+
|                                                             |
|  No offers available for EU . 30 Days . Standard            |
|                                                             |
|  Try selecting a different variant above,                   |
|  or check back later.                                       |
|                                                             |
+-------------------------------------------------------------+
```

#### Section 6: Product Description

**Heading**: `<h2>About {productName}</h2>`

- Content: Full `CatalogProduct.description` rendered as rich text
- This is the SEO content body — the longest text block on the page
- Server-rendered, crawlable
- May include product features, system requirements, what is included, etc.
- Managed by admin (not sellers — product descriptions are catalog-level)
- If description is null/empty: Section is omitted entirely (no empty container)

**Note**: Individual sellers have `offer.descriptionMarkdown` for their own marketing copy. This is NOT shown in the product description section. It could appear in an expanded offer detail in the future. The product description is the canonical, admin-curated content.

#### Section 7: Trust and Guarantee

**Heading**: `<h2>How It Works</h2>`

This section addresses the #1 objection for marketplace first-timers: "Is this safe?"

```
+--------------------------------------------------------------------+
|                                                                    |
|  H2: How It Works                                                  |
|                                                                    |
|  +----------+    +----------+    +----------+                      |
|  |  1.      |    |  2.      |    |  3.      |                      |
|  | Choose   |    |  Pay     |    | Receive  |                      |
|  | an offer |    | securely |    | your     |                      |
|  |          |    |          |    | product  |                      |
|  +----------+    +----------+    +----------+                      |
|                                                                    |
|  -- Buyer Protection --------------------------------------------- |
|                                                                    |
|  H3: Money-Back Guarantee                                          |
|  If your order is not delivered as described,                      |
|  we will refund your payment. [Learn more]                         |
|                                                                    |
|  H3: Secure Payments                                               |
|  All transactions are encrypted and processed                      |
|  through trusted payment providers.                                |
|                                                                    |
|  H3: Verified Sellers                                              |
|  Every seller is reviewed before they can                          |
|  list products on our marketplace.                                 |
|                                                                    |
+--------------------------------------------------------------------+
```

**Why this matters**: Digital goods marketplaces have inherent trust issues. Buyers are paying money for a key/code from a stranger. This section exists on EVERY product page as persistent reassurance. It is not a marketing page — it is a conversion tool.

**Mobile**: 3-step icons stack horizontally (scrollable) or vertically. Trust points stack vertically.

#### Section 8: Related Products

**Heading**: `<h2>Similar Products</h2>`

- Shows 4-8 products from the same child category (excluding current product)
- Each card: Image, product name, "From $X.XX", category badge
- Cards link to their respective `/p/[productSlug]` pages
- Server-rendered (SEO: internal linking, keeps crawler moving)
- Desktop: 4-column grid
- Mobile: Horizontal scroll (carousel without autoplay)

**Why**: Internal linking for SEO. Cross-sell for conversion. Keeps bounced users in the catalog instead of going back to Google.

---

### 2.4 Desktop Layout — Full Page Wireframe

```
+----------------------------------------------------------------------+
| [HEADER — sticky]                                                    |
+----------------------------------------------------------------------+
|                                                                      |
| Breadcrumbs: Home > Games > PC Games > Minecraft Java Edition        |
|                                                                      |
| +----------------------------+----------------------------------+    |
| |                            |                                  |    |
| |  [Product Image]           |  H1: Minecraft Java Edition      |    |
| |                            |  <Badge>PC Games</Badge>         |    |
| |                            |  5 sellers . From $19.99         |    |
| |                            |  (lightning) Instant delivery    |    |
| |                            |                                  |    |
| |                            |  {Short description...}          |    |
| |                            |                                  |    |
| |                            |  +- Variant Selector ----------+ |    |
| |                            |  | Region:  [EU] [US] [GLOBAL] | |    |
| |                            |  | Edition: [Java] [Bedrock]   | |    |
| |                            |  +------------------------------+ |    |
| |                            |                                  |    |
| |                            |  +- Best Offer ----------------+ |    |
| |                            |  | $20.59                      | |    |
| |                            |  | $19.99 + $0.60 service fee  | |    |
| |                            |  | (lightning) Instant Delivery | |    |
| |                            |  | from GameKeysPlus            | |    |
| |                            |  |                              | |    |
| |                            |  | [     Add to Cart      ]    | |    |
| |                            |  |                              | |    |
| |                            |  | (check) Buyer protection    | |    |
| |                            |  | (check) Secure payment      | |    |
| |                            |  +------------------------------+ |    |
| |                            |         (sticky on scroll)       |    |
| +----------------------------+----------------------------------+    |
|                                                                      |
| -------------------------------------------------------------------- |
|                                                                      |
| H2: All Offers (5)                    Sort: [Price] [Speed] ...      |
|                                                                      |
| +---------------------------------------------------------------+   |
| | [GK]  GameKeysPlus    (lightning) Instant      $20.59  [Add]  |   |
| |       New seller                  Delivery                    |   |
| +---------------------------------------------------------------+   |
| | [DG]  DigiGoods       (clock) ~1 hour         $18.50  [Add]  |   |
| |       New seller               delivery                       |   |
| +---------------------------------------------------------------+   |
| | [KM]  KeyMaster       (lightning) Instant      $21.99  [Add]  |   |
| |       New seller                  Delivery                    |   |
| +---------------------------------------------------------------+   |
|                                                                      |
| -------------------------------------------------------------------- |
|                                                                      |
| H2: About Minecraft Java Edition                                     |
|                                                                      |
| {Full product description rendered as rich text...}                  |
|                                                                      |
| -------------------------------------------------------------------- |
|                                                                      |
| H2: How It Works                                                     |
|                                                                      |
| [1. Choose]  [2. Pay]  [3. Receive]                                  |
|                                                                      |
| H3: Money-Back Guarantee ...                                         |
| H3: Secure Payments ...                                              |
| H3: Verified Sellers ...                                             |
|                                                                      |
| -------------------------------------------------------------------- |
|                                                                      |
| H2: Similar Products                                                 |
|                                                                      |
| [Card] [Card] [Card] [Card]                                         |
|                                                                      |
+----------------------------------------------------------------------+
| [FOOTER]                                                             |
+----------------------------------------------------------------------+
```

**Column split**: Left ~55%, Right ~45%. Max content width: 1280px centered.

---

### 2.5 Mobile Layout — Full Page Wireframe

```
+--------------------------------+
| [HEADER — sticky, 56px]       |
+--------------------------------+
| Home > Games > PC Games       |  (horizontal scroll)
+--------------------------------+
|                                |
| [Product Image — full width]   |
|                                |
| H1: Minecraft Java Edition     |
| <Badge>PC Games</Badge>       |
| 5 sellers . From $19.99       |
| (lightning) Instant delivery   |
|                                |
| {Short description...}        |
|                                |
+--------------------------------+
| Region:  [EU] [US] [GLOBAL]   |  (horizontal scroll)
| Edition: [Java] [Bedrock]     |
+--------------------------------+
| +- Best Offer --------------+ |
| | $20.59                    | |
| | $19.99 + $0.60 fee       | |
| | (lightning) Instant       | |
| | from GameKeysPlus         | |
| | (check) Buyer protection  | |
| +---------------------------+ |
+--------------------------------+
| H2: All Offers (5)            |
|                                |
| +---------------------------+ |
| | GameKeysPlus              | |
| | (lightning) Instant       | |
| | $20.59      [Add to Cart] | |
| +---------------------------+ |
| +---------------------------+ |
| | DigiGoods                 | |
| | (clock) ~1 hour           | |
| | $18.50      [Add to Cart] | |
| +---------------------------+ |
| +---------------------------+ |
| | KeyMaster                 | |
| | (lightning) Instant       | |
| | $21.99      [Add to Cart] | |
| +---------------------------+ |
|                                |
+--------------------------------+
| H2: About Minecraft Java...   |
| {description...}               |
+--------------------------------+
| H2: How It Works               |
| [1] [2] [3]                    |
| Trust signals...               |
+--------------------------------+
| H2: Similar Products           |
| [Card] [Card] -> (scroll)     |
+--------------------------------+
| [FOOTER — accordion]           |
+--------------------------------+
|                                |
| +----------------------------+ |
| | $20.59    [Add to Cart]    | |  <- STICKY BOTTOM BAR
| +----------------------------+ |
+--------------------------------+
```

**Sticky Bottom Bar (Mobile Only)**:
- Fixed to bottom of viewport
- Shows: Best offer price (left) + "Add to Cart" CTA (right)
- Background: `bg-background` with top border and subtle shadow
- Appears after the user scrolls past the inline Best Offer section
- Disappears if user scrolls back up to the Best Offer
- **Why**: On mobile, the CTA scrolls out of view quickly. The sticky bar ensures conversion is always one tap away. This is standard practice (Amazon, G2A, Eneba all do this).
- Height: 64px. Padding accounts for safe area on iOS (env(safe-area-inset-bottom)).

---

### 2.6 Loading and Empty States

**Mental model**: Skeleton UI everywhere. No spinners. Skeletons maintain layout shape during load, preventing CLS and giving the perception of speed.

**Product Page Skeleton** (shown during server-side data fetch or client hydration):

| Section | Skeleton Shape |
|---------|---------------|
| Breadcrumb | 4 small rectangular blocks with separator dots |
| Product Image | Rectangle matching aspect ratio, pulsing `bg-muted` |
| H1 / Title | Wide rectangular block |
| Category badge | Small pill shape |
| Quick stats | Medium rectangular block |
| Variant selector | Row of pill-shaped blocks |
| Best Offer box | Card-shaped block with internal lines |
| Offer rows | 3 card skeletons stacked |
| Description | 6-8 text line blocks of varying width |

**Use `<Skeleton>` from `@workspace/ui`** for all placeholder shapes.

**Empty States**:

| State | Display |
|-------|---------|
| **No offers for variant** | "No offers available for {variant description}. Try a different variant above, or check back later." — centered, `text-muted-foreground` |
| **No offers at all** | "This product has no active offers yet. Check back later." — centered, `text-muted-foreground` |
| **Product not found (404)** | Custom 404 page: "Product not found. It may have been removed or the URL is incorrect." + Search bar + link to home |
| **Error loading** | `<Alert variant="destructive">` with retry button. "Something went wrong loading this product. Please try again." |

---

### 2.7 Server vs Client Component Boundary

| Component | Rendering | Why |
|-----------|-----------|-----|
| Product page layout | Server | SEO: full HTML in initial response |
| Breadcrumb | Server | Static, crawlable |
| Product Hero (image, title, description) | Server | SEO content |
| Structured Data (JSON-LD) | Server | Must be in initial HTML for crawlers |
| Variant Selector | Client | Interactive state management |
| Best Offer box | Client | Updates when variant changes |
| Offers List | Client | Sorting, filtering, variant-reactive |
| Product Description | Server | SEO content body |
| Trust and Guarantee | Server | Static content |
| Related Products | Server | SEO internal links |
| Sticky Bottom Bar (mobile) | Client | Scroll-position-aware |

**Pattern**: The page is a Server Component that fetches all data (product, variants, offers). It passes data as props to client component islands where interactivity is needed. This gives us full SEO content on first render + interactive experience after hydration.

---

### 2.8 Index/NoIndex Decision Map

| Page | robots | Reason |
|------|--------|--------|
| `/p/[productSlug]` | index, follow | Core catalog page, must be indexed |
| `/p/[productSlug]?variant=...` | canonical points to `/p/[productSlug]` | Variant params must not create separate indexed pages |
| `/c/[...slugs]` | index, follow | Category pages are SEO landing pages |
| `/search?q=...` | noindex, follow | Infinite query combinations, thin content risk |
| `/cart` | noindex, nofollow | Transactional, per-user |
| `/checkout/*` | noindex, nofollow | Transactional, per-user |
| `/orders/*` | noindex, nofollow | Authenticated, per-user |
| `/account/*` | noindex, nofollow | Authenticated, per-user |
| `/auth/*` | noindex, nofollow | Transactional |

---

## Summary of Key UX Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Variant selector style | Pill buttons (visible) | Digital goods have few variants. Show all options without extra clicks. |
| Best offer promotion | Dedicated section above offer list | Reduces decision fatigue. 80% of buyers take the first option. Power users scroll down. |
| Delivery type labeling | "Instant Delivery" / "~{time} delivery" | No jargon. Clear expectations. Buyer never sees "AUTO_KEY" or "MANUAL". |
| Price display | Buyer total primary, breakdown secondary | Buyer cares about what they pay. Transparency available on demand. |
| SLA visibility | Same visual level as price | Time is the second dimension of value for digital goods. Hiding it would bias comparison. |
| Variant URL behavior | No URL change, single canonical | Prevents thin content, consolidates SEO authority on one URL. |
| Mobile CTA | Sticky bottom bar | CTA must be one tap away at all times on mobile. |
| Loading states | Skeletons only, no spinners | Maintains layout shape, prevents CLS, feels faster. |
| Category nav in header | Mega-menu with crawlable links | SEO internal linking + browse-first users need category access from any page. |
| Footer categories | All parent categories linked | SEO link equity from every page to category pages. |
| Trust section | On every product page | First-time marketplace buyers need repeated reassurance. |
| Heading hierarchy | Strict H1 then H2 then H3 | SEO compliance, accessibility, document outline. |
