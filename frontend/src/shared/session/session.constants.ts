// Cookie names are set by the backend (backend/src/modules/auth/sessions/session-cookies.service.ts, PLAN D9).
export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export const SIGN_IN_PATH = "/sign-in";
// The main page after sign-in (PLAN D17).
export const HOME_PATH = "/users";

// GraphQL operations that never trigger a session refresh: their UNAUTHENTICATED answer is the result
// (wrong password, no session to end) and not an expired session.
export const SESSION_OPERATIONS: ReadonlySet<string> = new Set(["SignIn", "SignOut", "Refresh"]);
