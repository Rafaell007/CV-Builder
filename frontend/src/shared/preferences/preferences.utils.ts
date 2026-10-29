import { DEFAULT_LANGUAGE, DEFAULT_THEME, LANGUAGES, THEMES } from "./preferences.constants";
import type { Language, Theme } from "./preferences.types";

export const parseTheme = (value: string | undefined): Theme =>
  THEMES.find((theme) => theme === value) ?? DEFAULT_THEME;

export const parseLanguage = (value: string | undefined): Language =>
  LANGUAGES.find((language) => language === value) ?? DEFAULT_LANGUAGE;

export const readCookie = (cookies: string, name: string): string | undefined => {
  const match = cookies.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] === undefined ? undefined : decodeURIComponent(match[1]);
};
