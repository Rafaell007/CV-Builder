"use client";

import { useLayoutEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { PreferencesContext } from "../../PreferencesContext";
import { applyLanguage, applyTheme } from "../../preferences.browser";
import { getServerSnapshot, getSnapshot, saveLanguage, saveTheme, subscribe } from "../../store";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { theme, language } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Dev Strict Mode remount clears <html> attributes; re-apply the saved values (no-op in production).
  // Reads the cookies, not the rendered value, which is still the server default during hydration.
  useLayoutEffect(() => {
    const saved = getSnapshot();
    applyTheme(saved.theme);
    applyLanguage(saved.language);
  }, []);

  const value = useMemo(
    () => ({ theme, language, setTheme: saveTheme, setLanguage: saveLanguage }),
    [theme, language],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}
