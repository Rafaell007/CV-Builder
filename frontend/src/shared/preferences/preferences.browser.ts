import { COOKIE_MAX_AGE_SECONDS } from "./preferences.constants";
import type { Theme } from "./preferences.types";

export const writeCookie = (name: string, value: string): void => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

// "system" removes the attribute, so themes.css follows the OS.
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
};
