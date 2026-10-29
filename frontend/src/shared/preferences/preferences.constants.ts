import type { Language, Theme } from "./preferences.types";

export const THEMES = ["light", "dark", "system"] as const;
export const LANGUAGES = ["en", "pl"] as const;

export const DEFAULT_THEME: Theme = "system";
export const DEFAULT_LANGUAGE: Language = "en";

export const THEME_COOKIE = "theme";
export const LANGUAGE_COOKIE = "locale";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
