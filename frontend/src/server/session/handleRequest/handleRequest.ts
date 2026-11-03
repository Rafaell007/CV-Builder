import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { parseSetCookie } from "../utils";
import { resolveSession } from "../resolveSession";
import { routing, splitLocale } from "@/shared/i18n";
import { ACCESS_COOKIE, getRouteKind, REFRESH_COOKIE, resolveRedirect } from "@/shared/session";

// Adds the language to paths without one (from the `locale` cookie, else English) and keeps the cookie current.
// https://next-intl.dev/docs/routing/middleware
const handleI18nRouting = createMiddleware(routing);

// Called by `src/proxy.ts` before every page (PLAN D9): makes sure the URL has a language, refreshes an expired
// session, then sends the visitor where the route rules say. It only improves navigation; the backend still
// checks every request (PLAN D10).
export async function handleRequest(request: NextRequest, backendUrl: string) {
  // No language yet: next-intl redirects to the same path with one, and the session is checked on that request.
  const { locale, path } = splitLocale(request.nextUrl.pathname);
  if (!locale) return handleI18nRouting(request);

  const kind = getRouteKind(path);
  if (kind === "public") return handleI18nRouting(request);

  const session = await resolveSession({
    backendUrl,
    accessToken: request.cookies.get(ACCESS_COOKIE)?.value,
    refreshToken: request.cookies.get(REFRESH_COOKIE)?.value,
    needRole: kind === "admin-only",
    nowMs: Date.now(),
    // Behind a TLS-terminating proxy the request looks like plain HTTP; the proxy tells the real protocol.
    secureCookies:
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https",
  });

  // Cookies the backend issued or cleared while checking: the page being rendered must see them too,
  // so they go into the request before next-intl passes it on.
  for (const header of session.setCookies) {
    const cookie = parseSetCookie(header);
    if (!cookie) continue;
    if (cookie.value === "") request.cookies.delete(cookie.name);
    else request.cookies.set(cookie.name, cookie.value);
  }

  // The backend did not answer, so the visitor is not signed out for it. The page shows its own error.
  // Cookies a refresh already issued still go out, or the browser would keep a refresh token that is used up.
  const redirectTo =
    session.status === "unavailable"
      ? null
      : resolveRedirect(
          kind,
          session.status === "active",
          session.status === "active" ? session.role : null,
        );

  // A redirect stays in the visitor's language: /pl/admin → /pl/sign-in.
  const response = redirectTo
    ? NextResponse.redirect(new URL(`/${locale}${redirectTo}`, request.url))
    : handleI18nRouting(request);
  for (const header of session.setCookies) response.headers.append("set-cookie", header);
  return response;
}
