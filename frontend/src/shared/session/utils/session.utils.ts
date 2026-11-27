import type { Role } from "@/shared/graphql";
import { HOME_PATH, SIGN_IN_PATH } from "../session.constants";

export type RouteKind = "public" | "guest-only" | "protected" | "admin-only";

// Seconds before `exp` at which a token already counts as expired, so it cannot expire on the way to the backend.
const EXPIRY_MARGIN_SECONDS = 10;

const GUEST_ONLY_PATHS = ["/sign-in", "/sign-up"];
const PROTECTED_PATHS = ["/users", "/cvs", "/skills", "/languages", "/settings", "/verify-email"];
const ADMIN_ONLY_PATHS = ["/admin"];
// The CVs tab of a user's page is for admins only (PLAN §6).
const ADMIN_ONLY_PATTERNS = [/^\/users\/[^/]+\/cvs(\/|$)/];

function matchesPath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Sorts a pathname into the access rule that applies to it (PLAN §6). Unknown paths are public: they show not-found. */
export function getRouteKind(pathname: string): RouteKind {
  if (
    ADMIN_ONLY_PATHS.some((path) => matchesPath(pathname, path)) ||
    ADMIN_ONLY_PATTERNS.some((pattern) => pattern.test(pathname))
  ) {
    return "admin-only";
  }
  if (GUEST_ONLY_PATHS.some((path) => matchesPath(pathname, path))) return "guest-only";
  if (PROTECTED_PATHS.some((path) => matchesPath(pathname, path))) return "protected";
  return "public";
}

/**
 * Where to send the visitor instead of showing the route, or `null` when the route may be shown.
 * `role` matters only for admin-only routes, so it may be `null` for a signed-in visitor on the others.
 */
export function resolveRedirect(
  kind: RouteKind,
  signedIn: boolean,
  role: Role | null,
): string | null {
  switch (kind) {
    case "public":
      return null;
    case "guest-only":
      return signedIn ? HOME_PATH : null;
    case "protected":
      return signedIn ? null : SIGN_IN_PATH;
    case "admin-only":
      if (!signedIn) return SIGN_IN_PATH;
      return role === "ADMIN" ? null : HOME_PATH;
  }
}

/**
 * Reads `exp` from a JWT payload without checking the signature. Only the backend can check it; this
 * answer decides whether to refresh first, never whether to trust the user.
 */
export function isAccessTokenFresh(token: string | undefined, nowMs: number): boolean {
  if (!token) return false;
  const payload = token.split(".")[1];
  if (!payload) return false;
  try {
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: unknown;
    };
    return typeof exp === "number" && exp * 1000 - EXPIRY_MARGIN_SECONDS * 1000 > nowMs;
  } catch {
    return false;
  }
}
