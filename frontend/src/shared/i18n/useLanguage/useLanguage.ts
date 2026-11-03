"use client";

import { useLocale, type Locale } from "next-intl";
import { useCallback } from "react";
import { usePathname, useRouter } from "../navigation";
import { routing } from "../routing";

export type UseLanguageResult = {
  language: Locale;
  languages: readonly Locale[];
  setLanguage: (language: Locale) => void;
};

/**
 * The current language and a setter for the language selector (Settings, S4.4).
 * Switching opens the same page under the new language (/en/settings → /pl/settings); the proxy then saves it
 * in the `locale` cookie, so it stays after a refresh. https://next-intl.dev/docs/routing/navigation
 */
export function useLanguage(): UseLanguageResult {
  const language = useLocale();
  // The path without the language, e.g. "/settings".
  const pathname = usePathname();
  const router = useRouter();

  const setLanguage = useCallback(
    (next: Locale) => router.replace(pathname, { locale: next }),
    [router, pathname],
  );

  return { language, languages: routing.locales, setLanguage };
}
