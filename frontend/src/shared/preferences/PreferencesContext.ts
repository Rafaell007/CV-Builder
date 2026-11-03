"use client";

import { createContext } from "react";
import type { Preferences, Theme } from "./preferences.types";

export type PreferencesContextValue = Preferences & {
  setTheme: (theme: Theme) => void;
};

// null = used outside PreferencesProvider (usePreferences throws).
export const PreferencesContext = createContext<PreferencesContextValue | null>(null);
