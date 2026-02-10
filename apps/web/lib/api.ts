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
/*  Category types — mirror the API response shape                            */
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

export interface CategoriesNavResponse {
  parents: NavParentCategory[];
}

/* -------------------------------------------------------------------------- */
/*  Fetch helpers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the 2-level category tree for header/footer navigation.
 *
 * - Calls `GET /categories` on the API.
 * - Cached with `next.revalidate = 300` (5 minutes) so the header
 *   doesn't hammer the API on every page view.
 * - Returns an empty array on error so the shell never crashes.
 */
export async function fetchCategoriesNav(): Promise<NavParentCategory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const data: CategoriesNavResponse = await res.json();
    return data.parents ?? [];
  } catch {
    // API unreachable — degrade gracefully
    return [];
  }
}
