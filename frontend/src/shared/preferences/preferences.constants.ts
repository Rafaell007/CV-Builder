import type { Theme } from "./preferences.types";

export const THEMES = ["light", "dark", "system"] as const;

export const DEFAULT_THEME: Theme = "system";

export const THEME_COOKIE = "theme";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
