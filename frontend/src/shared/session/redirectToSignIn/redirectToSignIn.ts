import { SIGN_IN_PATH } from "../session.constants";

let redirecting = false;

/**
 * Leaves the app for the sign-in page with a full page load, so every cached user data is dropped.
 * Runs once: several failed requests can end the session at the same moment. It does nothing on the sign-in page.
 */
export function redirectToSignIn(): void {
  // Already there: a reload would fail the same way and loop.
  if (redirecting || window.location.pathname === SIGN_IN_PATH) return;
  redirecting = true;
  window.location.assign(SIGN_IN_PATH);
}
