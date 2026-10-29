import { applyLanguage, applyTheme, writeCookie } from "../preferences.browser";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_THEME,
  LANGUAGE_COOKIE,
  THEME_COOKIE,
} from "../preferences.constants";
import type { Language, Preferences, Theme } from "../preferences.types";
import { parseLanguage, parseTheme, readCookie } from "../utils";

// Store for useSyncExternalStore: the cookies are the state, React subscribes to changes.

const SERVER_SNAPSHOT: Preferences = { theme: DEFAULT_THEME, language: DEFAULT_LANGUAGE };

const listeners = new Set<() => void>();
let lastSnapshot = SERVER_SNAPSHOT;

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Returns the same object while the values are unchanged, as useSyncExternalStore requires.
export const getSnapshot = (): Preferences => {
  const theme = parseTheme(readCookie(document.cookie, THEME_COOKIE));
  const language = parseLanguage(readCookie(document.cookie, LANGUAGE_COOKIE));
  if (theme !== lastSnapshot.theme || language !== lastSnapshot.language) {
    lastSnapshot = { theme, language };
  }
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

export const saveLanguage = (language: Language): void => {
  writeCookie(LANGUAGE_COOKIE, language);
  applyLanguage(language);
  notifyListeners();
};
