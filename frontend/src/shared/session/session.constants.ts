// Cookie names are set by the backend (backend/src/modules/auth/sessions/session-cookies.service.ts, PLAN D9).
export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export const SIGN_IN_PATH = "/sign-in";
// The main page after sign-in (PLAN D17).
export const HOME_PATH = "/users";
// Where a signed-in user who is not verified yet types the code from the email (after sign-up, VERIFY EMAIL).
export const VERIFY_EMAIL_PATH = "/verify-email";
// `extensions.reason` of the backend CONFLICT when the account is verified already (verifyEmail, resendVerificationCode).
export const ALREADY_VERIFIED_REASON = "ALREADY_VERIFIED";

// GraphQL operations that never trigger a session refresh: their UNAUTHENTICATED answer is the result
// (wrong password, no session to end) and not an expired session.
export const SESSION_OPERATIONS: ReadonlySet<string> = new Set(["SignIn", "SignOut", "Refresh"]);
