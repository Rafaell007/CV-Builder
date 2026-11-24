// Not `@/shared/i18n`: the proxy imports `@/shared/session`, and the i18n entry would bring navigation into it.
import { splitLocale } from "@/shared/i18n/utils";
import { SIGN_IN_PATH } from "../session.constants";

let redirecting = false;

/**
 * Leaves the app for the sign-in page with a full page load, so every cached user data is dropped.
 * Runs once: several failed requests can end the session at the same moment. It does nothing on the sign-in page.
 * Returns `true` when the redirect is under way (started now or before), and `false` when it did nothing.
 * The current language is kept; without one, the proxy adds it.
 */
export function redirectToSignIn(): boolean {
  const { locale, path } = splitLocale(window.location.pathname);
  // Already there: a reload would fail the same way and loop.
  if (path === SIGN_IN_PATH) return false;
  if (redirecting) return true;
  redirecting = true;
  window.location.assign(locale ? `/${locale}${SIGN_IN_PATH}` : SIGN_IN_PATH);
  return true;
}
