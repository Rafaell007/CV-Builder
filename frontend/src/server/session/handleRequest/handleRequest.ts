import { NextResponse, type NextRequest } from "next/server";
import { parseSetCookie } from "../utils";
import { resolveSession } from "../resolveSession";
import { ACCESS_COOKIE, getRouteKind, REFRESH_COOKIE, resolveRedirect } from "@/shared/session";

// Called by `src/proxy.ts` before every page (PLAN D9): refreshes an expired session, then sends the visitor where the route
// rules say. It only improves navigation; the backend still checks every request (PLAN D10).
export async function handleRequest(request: NextRequest, backendUrl: string) {
  const kind = getRouteKind(request.nextUrl.pathname);
  if (kind === "public") return NextResponse.next();

  const session = await resolveSession({
    backendUrl,
    accessToken: request.cookies.get(ACCESS_COOKIE)?.value,
    refreshToken: request.cookies.get(REFRESH_COOKIE)?.value,
    needRole: kind === "admin-only",
    nowMs: Date.now(),
    secureCookies: request.nextUrl.protocol === "https:",
  });

  // Cookies the backend issued or cleared while checking: the page being rendered must see them too.
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

  const response = redirectTo
    ? NextResponse.redirect(new URL(redirectTo, request.url))
    : NextResponse.next({ request: { headers: request.headers } });
  for (const header of session.setCookies) response.headers.append("set-cookie", header);
  return response;
}
