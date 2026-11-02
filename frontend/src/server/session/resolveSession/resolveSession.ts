import { MeDocument, RefreshDocument, type RefreshMutation, type Role } from "@/shared/graphql";
import { ACCESS_COOKIE, isAccessTokenFresh, REFRESH_COOKIE } from "@/shared/session";
import { postGraphql, type GraphqlResult } from "../postGraphql";
import { applySetCookies, clearSessionCookies, toCookieHeader } from "../utils";

// How long the answer of a finished refresh is reused. Next.js prefetches several pages at once and some of
// them arrive after the first refresh has finished, still carrying the old refresh token. The backend allows
// the old token one grace use; a third use looks like theft and ends the session (D21).
const REFRESH_REUSE_MS = 5_000;

type SharedRefresh = {
  result: Promise<GraphqlResult<RefreshMutation>>;
  // Set when the refresh has finished; `null` while it is running.
  finishedAtMs: number | null;
};

// Refreshes by the refresh token they were sent with.
const sharedRefreshes = new Map<string, SharedRefresh>();

function refreshOnce(
  backendUrl: string,
  refreshToken: string,
  cookieHeader: string,
): Promise<GraphqlResult<RefreshMutation>> {
  const now = Date.now();
  for (const [token, { finishedAtMs }] of sharedRefreshes) {
    if (finishedAtMs !== null && now - finishedAtMs > REFRESH_REUSE_MS)
      sharedRefreshes.delete(token);
  }
  const shared = sharedRefreshes.get(refreshToken);
  if (shared) return shared.result;

  const entry: SharedRefresh = {
    result: postGraphql(backendUrl, RefreshDocument, cookieHeader).finally(() => {
      entry.finishedAtMs = Date.now();
    }),
    finishedAtMs: null,
  };
  // A failed call is not kept: the next request may try again.
  entry.result.catch(() => sharedRefreshes.delete(refreshToken));
  sharedRefreshes.set(refreshToken, entry);
  return entry.result;
}

export type SessionResult =
  // A signed-in user. `role` is only read when the caller asks for it (`needRole`), else it is `null`.
  | { status: "active"; role: Role | null; setCookies: string[] }
  // No usable session. `setCookies` may hold the headers that clear the dead cookies.
  | { status: "none"; setCookies: string[] }
  // The backend did not answer properly, so nothing is known. The caller must not log the user out.
  // `setCookies` holds the cookies a refresh already issued; they must still reach the browser.
  | { status: "unavailable"; setCookies: string[] };

export type ResolveSessionInput = {
  backendUrl: string;
  accessToken: string | undefined;
  refreshToken: string | undefined;
  needRole: boolean;
  nowMs: number;
  // Whether the site is served over HTTPS. Cookies that are cleared must carry the same `Secure` flag.
  secureCookies: boolean;
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
  secureCookies,
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
      if (!refreshed.data?.refresh) return { status: "unavailable", setCookies };
    }

    if (!needRole) return { status: "active", role: null, setCookies };

    const current = await postGraphql(backendUrl, MeDocument, toCookieHeader(jar));
    // The token looked fresh but the backend refuses it (deleted user, rotated secret): the session is over.
    if (current.errorCodes.includes("UNAUTHENTICATED")) {
      return { status: "none", setCookies: [...setCookies, ...clearSessionCookies(secureCookies)] };
    }
    if (current.errorCodes.length > 0) return { status: "unavailable", setCookies };
    if (!current.data?.me) return { status: "none", setCookies };
    return { status: "active", role: current.data.me.role, setCookies };
  } catch {
    return { status: "unavailable", setCookies };
  }
}
