/**
 * Server-side API client for the buyer web app.
 *
 * All functions here run inside Server Components / server actions only.
 * They call the NestJS API directly (server-to-server) so the URL
 * uses the internal host, not the public domain.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/* -------------------------------------------------------------------------- */
/*  Category types                                                            */
/* -------------------------------------------------------------------------- */

export interface NavChildCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface NavParentCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  children: NavChildCategory[];
}

/* -------------------------------------------------------------------------- */
/*  Product page types                                                        */
/* -------------------------------------------------------------------------- */

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  parent: { id: string; name: string; slug: string } | null;
}

export interface VariantSummary {
  id: string;
  region: "EU" | "US" | "TR" | "GLOBAL";
  durationDays: number | null;
  edition: string | null;
  sku: string;
  supportsAutoKey: boolean;
  supportsManual: boolean;
  sortOrder: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  category: CategoryInfo;
  variants: VariantSummary[];
}

export interface PublicOffer {
  id: string;
  sellerId: string;
  sellerName: string;
  deliveryType: "AUTO_KEY" | "MANUAL";
  priceAmountCents: number;
  currency: string;
  estimatedDeliveryMinutes: number | null;
  inStock: boolean;
  publishedAt: string | null;
}

export interface OffersForVariantResponse {
  offers: PublicOffer[];
  platformFeeBps: number;
}

/* -------------------------------------------------------------------------- */
/*  Fetch helpers                                                             */
/* -------------------------------------------------------------------------- */

export async function fetchCategoriesNav(): Promise<NavParentCategory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.parents ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single product by slug with category and variant info.
 * Returns null on 404 or error.
 */
export async function fetchProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/catalog/products/by-slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch active offers for a variant, including platform fee bps.
 */
export async function fetchOffersForVariant(
  variantId: string,
): Promise<OffersForVariantResponse> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/public/offers/by-variant/${encodeURIComponent(variantId)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return { offers: [], platformFeeBps: 300 };
    return await res.json();
  } catch {
    return { offers: [], platformFeeBps: 300 };
  }
}
