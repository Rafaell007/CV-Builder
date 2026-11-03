"use client";

import { useLayoutEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { PreferencesContext } from "../../PreferencesContext";
import { applyTheme } from "../../preferences.browser";
import { getServerSnapshot, getSnapshot, saveTheme, subscribe } from "../../store";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { theme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Dev Strict Mode remount clears <html> attributes; re-apply the saved value (no-op in production).
  // Reads the cookie, not the rendered value, which is still the server default during hydration.
  useLayoutEffect(() => {
    applyTheme(getSnapshot().theme);
  }, []);

  const value = useMemo(() => ({ theme, setTheme: saveTheme }), [theme]);

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}
