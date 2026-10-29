"use client";

import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { PreferencesContext } from "../../PreferencesContext";
import { applyLanguage, applyTheme, writeCookie } from "../../preferences.browser";
import { LANGUAGE_COOKIE, THEME_COOKIE } from "../../preferences.constants";
import type { Language, Theme } from "../../preferences.types";
import { parseLanguage, parseTheme, readCookie } from "../../utils";

// Lazy initial state: same cookies as PreferencesScript, so state matches the page. Defaults on the server.
const readCookieValue = (name: string): string | undefined =>
  typeof document === "undefined" ? undefined : readCookie(document.cookie, name);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(() => parseTheme(readCookieValue(THEME_COOKIE)));
  const [language, setLanguageState] = useState(() =>
    parseLanguage(readCookieValue(LANGUAGE_COOKIE)),
  );

  // Applies changes before paint; also re-applies after the dev Strict Mode remount clears <html> attributes.
  useLayoutEffect(() => {
    applyTheme(theme);
    applyLanguage(language);
  }, [theme, language]);

  const setTheme = useCallback((next: Theme) => {
    writeCookie(THEME_COOKIE, next);
    setThemeState(next);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    writeCookie(LANGUAGE_COOKIE, next);
    setLanguageState(next);
  }, []);

  const value = useMemo(
    () => ({ theme, language, setTheme, setLanguage }),
    [theme, language, setTheme, setLanguage],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}
