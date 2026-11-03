import { hasLocale, type Locale } from "next-intl";
import { routing } from "../routing";

export type LocalizedPath = {
  // null when the path does not start with a supported language.
  locale: Locale | null;
  // The path without the language: "/pl/users" → "/users", "/pl" → "/".
  path: string;
};

/** Splits the language segment off a pathname, so route rules can work on language-free paths. */
export function splitLocale(pathname: string): LocalizedPath {
  const [, first, ...rest] = pathname.split("/");
  if (!hasLocale(routing.locales, first)) return { locale: null, path: pathname };
  return { locale: first, path: `/${rest.join("/")}` };
}
