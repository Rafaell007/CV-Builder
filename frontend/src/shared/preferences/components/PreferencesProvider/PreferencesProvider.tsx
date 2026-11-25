"use client";

import {
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { PreferencesContext } from "../../PreferencesContext";
import { applyTheme } from "../../preferences.browser";
import { getServerSnapshot, getSnapshot, saveTheme, subscribe } from "../../store";

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { theme: savedTheme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // The saved theme reaches the context as a deferred update, not a blocking one. Right after hydration a blocking
  // context update makes React render again every streamed part of the page that is not hydrated yet: a list that
  // the server rendered (PLAN D6) would drop its rows for the loading state for a moment (measured, KAN-172).
  const theme = useDeferredValue(savedTheme);

  // Dev Strict Mode remount clears <html> attributes; re-apply the saved value (no-op in production).
  // Reads the cookie, not the rendered value, which is still the server default during hydration.
  useLayoutEffect(() => {
    applyTheme(getSnapshot().theme);
  }, []);

  const value = useMemo(() => ({ theme, setTheme: saveTheme }), [theme]);

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}
