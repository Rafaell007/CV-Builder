"use client";

import { useContext } from "react";
import { PreferencesContext, type PreferencesContextValue } from "../PreferencesContext";

// Current theme and a setter that saves it in a cookie.
export const usePreferences = (): PreferencesContextValue => {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
};
