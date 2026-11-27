import { DEFAULT_THEME, THEMES } from "../preferences.constants";
import type { Theme } from "../preferences.types";

export const parseTheme = (value: string | undefined): Theme =>
  THEMES.find((theme) => theme === value) ?? DEFAULT_THEME;

export const readCookie = (cookies: string, name: string): string | undefined => {
  const match = cookies.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] === undefined ? undefined : decodeURIComponent(match[1]);
};
