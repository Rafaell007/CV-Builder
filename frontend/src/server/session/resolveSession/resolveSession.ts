import { MeDocument, RefreshDocument, type RefreshMutation, type Role } from "@/shared/graphql";
import { ACCESS_COOKIE, isAccessTokenFresh, REFRESH_COOKIE } from "@/shared/session";
import { postGraphql, type GraphqlResult } from "../postGraphql";
import { applySetCookies, toCookieHeader } from "../utils";

// Refreshes that are running now, by refresh token. Next.js prefetches several pages at once; each would
// send the same refresh token, and the backend treats a third use as theft and ends the session (D21).
const refreshesInFlight = new Map<string, Promise<GraphqlResult<RefreshMutation>>>();

function refreshOnce(
  backendUrl: string,
  refreshToken: string,
  cookieHeader: string,
): Promise<GraphqlResult<RefreshMutation>> {
  const running = refreshesInFlight.get(refreshToken);
  if (running) return running;
  const started = postGraphql(backendUrl, RefreshDocument, cookieHeader).finally(() => {
    refreshesInFlight.delete(refreshToken);
  });
  refreshesInFlight.set(refreshToken, started);
  return started;
}

export type SessionResult =
  // A signed-in user. `role` is only read when the caller asks for it (`needRole`), else it is `null`.
  | { status: "active"; role: Role | null; setCookies: string[] }
  // No usable session. `setCookies` may hold the headers that clear the dead cookies.
  | { status: "none"; setCookies: string[] }
  // The backend did not answer properly, so nothing is known. The caller must not log the user out.
  | { status: "unavailable" };

export type ResolveSessionInput = {
  backendUrl: string;
  accessToken: string | undefined;
  refreshToken: string | undefined;
  needRole: boolean;
  nowMs: number;
};

/**
 * Finds out whether the visitor has a session. Refreshes it first when the access token has expired
 * (PLAN D9) and, for admin-only routes, asks the backend for the role. The access token holds only the
 * user id, so the role cannot be read from it.
 */
export async function resolveSession({
  backendUrl,
  accessToken,
  refreshToken,
  needRole,
  nowMs,
}: ResolveSessionInput): Promise<SessionResult> {
  const jar = new Map<string, string>();
  if (accessToken) jar.set(ACCESS_COOKIE, accessToken);
  if (refreshToken) jar.set(REFRESH_COOKIE, refreshToken);
  const setCookies: string[] = [];

  try {
    if (!isAccessTokenFresh(accessToken, nowMs)) {
      if (!refreshToken) return { status: "none", setCookies };

      const refreshed = await refreshOnce(backendUrl, refreshToken, toCookieHeader(jar));
      setCookies.push(...refreshed.setCookies);
      applySetCookies(jar, refreshed.setCookies);
      if (refreshed.errorCodes.includes("UNAUTHENTICATED")) return { status: "none", setCookies };
      if (!refreshed.data?.refresh) return { status: "unavailable" };
    }

    if (!needRole) return { status: "active", role: null, setCookies };

    const current = await postGraphql(backendUrl, MeDocument, toCookieHeader(jar));
    if (current.errorCodes.length > 0) return { status: "unavailable" };
    if (!current.data?.me) return { status: "none", setCookies };
    return { status: "active", role: current.data.me.role, setCookies };
  } catch {
    return { status: "unavailable" };
  }
}
