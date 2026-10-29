"use client";

import { createContext } from "react";
import type { Language, Theme } from "./preferences";

export type PreferencesContextValue = {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
};

// null = used outside PreferencesProvider (usePreferences throws).
export const PreferencesContext = createContext<PreferencesContextValue | null>(null);
