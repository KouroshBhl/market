import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./lib/i18n";

/**
 * Middleware for locale-based routing.
 *
 * - If the path already starts with a supported locale, pass through
 *   and forward the locale as a request header (`x-locale`).
 * - If the path has no locale prefix, redirect to /{defaultLocale}{path}.
 * - Static assets and Next.js internals are excluded via the matcher.
 */

function getLocaleFromPathname(pathname: string): string | null {
  const firstSegment = pathname.split("/")[1];
  if (
    firstSegment &&
    (SUPPORTED_LOCALES as readonly string[]).includes(firstSegment)
  ) {
    return firstSegment;
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const locale = getLocaleFromPathname(pathname);

  if (locale) {
    // Path already has a valid locale — forward it as a request header
    // so the root layout can read it via headers().
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", locale);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // No locale in path — redirect to default locale
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Match all paths EXCEPT Next.js internals, API routes, and static files
  matcher: ["/((?!_next|api|favicon\\.ico|.*\\..*).*)", "/"],
};
