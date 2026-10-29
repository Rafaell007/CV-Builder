// Theme and language preferences, stored in cookies (PLAN D5, D26).
export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

// Only languages with translations (PLAN D27).
export const LANGUAGES = ["en", "pl"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_THEME: Theme = "system";
export const DEFAULT_LANGUAGE: Language = "en";

export const THEME_COOKIE = "theme";
export const LANGUAGE_COOKIE = "locale";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, in seconds

export const parseTheme = (value: string | undefined): Theme =>
  THEMES.find((theme) => theme === value) ?? DEFAULT_THEME;

export const parseLanguage = (value: string | undefined): Language =>
  LANGUAGES.find((language) => language === value) ?? DEFAULT_LANGUAGE;
