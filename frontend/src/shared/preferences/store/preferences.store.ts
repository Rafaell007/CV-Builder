import { applyTheme, writeCookie } from "../preferences.browser";
import { DEFAULT_THEME, THEME_COOKIE } from "../preferences.constants";
import type { Preferences, Theme } from "../preferences.types";
import { parseTheme, readCookie } from "../utils";

// Store for useSyncExternalStore: the cookies are the state, React subscribes to changes.

const SERVER_SNAPSHOT: Preferences = { theme: DEFAULT_THEME };

const listeners = new Set<() => void>();
let lastSnapshot = SERVER_SNAPSHOT;

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Returns the same object while the values are unchanged, as useSyncExternalStore requires.
export const getSnapshot = (): Preferences => {
  const theme = parseTheme(readCookie(document.cookie, THEME_COOKIE));
  if (theme !== lastSnapshot.theme) lastSnapshot = { theme };
  return lastSnapshot;
};

// The server cannot read the cookies; hydration uses the same defaults, so the HTML always matches.
export const getServerSnapshot = (): Preferences => SERVER_SNAPSHOT;

const notifyListeners = () => listeners.forEach((listener) => listener());

export const saveTheme = (theme: Theme): void => {
  writeCookie(THEME_COOKIE, theme);
  applyTheme(theme);
  notifyListeners();
};
