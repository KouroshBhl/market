import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n";
import type { CategoryInfo } from "@/lib/api";

export function ProductBreadcrumb({
  productName,
  category,
  locale,
}: {
  productName: string;
  category: CategoryInfo;
  locale: Locale;
}) {
  const crumbs: { label: string; href?: string }[] = [
    { label: "Home", href: localePath(locale, "/") },
  ];

  if (category.parent) {
    crumbs.push({
      label: category.parent.name,
      href: localePath(locale, `/c/${category.parent.slug}`),
    });
    crumbs.push({
      label: category.name,
      href: localePath(
        locale,
        `/c/${category.parent.slug}/${category.slug}`,
      ),
    });
  } else {
    crumbs.push({
      label: category.name,
      href: localePath(locale, `/c/${category.slug}`),
    });
  }

  crumbs.push({ label: productName });

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
