import { COOKIE_MAX_AGE } from "./preferences";

// Reads one cookie from a `document.cookie`-style string.
export const readCookie = (cookies: string, name: string): string | undefined => {
  const match = cookies.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] === undefined ? undefined : decodeURIComponent(match[1]);
};

// Browser only: stores the value for the whole site for 1 year.
export const writeCookie = (name: string, value: string): void => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
};
