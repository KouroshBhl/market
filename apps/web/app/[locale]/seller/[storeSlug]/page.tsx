import { redirect, notFound } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Public store page with slug resolution + redirect.
 *
 * Resolution logic:
 *   1. If slug == current slug → render the store page
 *   2. If slug is a historical slug → 308 redirect to the current slug (preserves method/query)
 *   3. Otherwise → 404
 */
export default async function StoreBySlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, storeSlug } = await params;
  const query = await searchParams;

  // Resolve slug via the public API
  let resolved: { currentSlug: string; sellerId: string; isRedirect: boolean };
  try {
    const res = await fetch(`${API_URL}/public/store/resolve/${storeSlug}`, {
      cache: "no-store",
    });

    if (res.status === 404) {
      notFound();
    }

    if (!res.ok) {
      notFound();
    }

    resolved = await res.json();
  } catch {
    notFound();
  }

  // If this is a historical slug, redirect to the current one
  if (resolved.isRedirect) {
    // Build the redirect URL preserving querystring
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") {
        qs.set(key, value);
      } else if (Array.isArray(value)) {
        for (const v of value) qs.append(key, v);
      }
    }
    const qsStr = qs.toString();
    const target = `/${locale}/seller/${resolved.currentSlug}${qsStr ? `?${qsStr}` : ""}`;

    redirect(target); // Next.js redirect (308 by default in app router)
  }

  // ── Current slug → render store page ──
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">{resolved.currentSlug}</h1>
        <p className="text-muted-foreground">
          Store page for <span className="font-mono">{resolved.currentSlug}</span>. Full store page coming soon.
        </p>
      </div>
    </main>
  );
}
