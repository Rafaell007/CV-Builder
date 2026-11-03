import { splitLocale } from "@/shared/i18n";
import { SIGN_IN_PATH } from "../session.constants";

let redirecting = false;

/**
 * Leaves the app for the sign-in page with a full page load, so every cached user data is dropped.
 * Runs once: several failed requests can end the session at the same moment. It does nothing on the sign-in page.
 * The current language is kept; without one, the proxy adds it.
 */
export function redirectToSignIn(): void {
  const { locale, path } = splitLocale(window.location.pathname);
  // Already there: a reload would fail the same way and loop.
  if (redirecting || path === SIGN_IN_PATH) return;
  redirecting = true;
  window.location.assign(locale ? `/${locale}${SIGN_IN_PATH}` : SIGN_IN_PATH);
}
