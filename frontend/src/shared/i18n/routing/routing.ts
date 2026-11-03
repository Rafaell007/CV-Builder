import { defineRouting } from "next-intl/routing";

// Shared with the proxy: a redirect it builds by hand must write the same cookie that next-intl writes.
export const LOCALE_COOKIE = { name: "locale", maxAge: 60 * 60 * 24 * 365 };

// Every URL starts with the language (/en/users, /pl/users). The `locale` cookie remembers the last one,
// so a link without a language opens in it (PLAN D27). https://next-intl.dev/docs/routing/configuration
export const routing = defineRouting({
  locales: ["en", "pl"],
  defaultLocale: "en",
  localePrefix: "always",
  localeCookie: LOCALE_COOKIE,
});
