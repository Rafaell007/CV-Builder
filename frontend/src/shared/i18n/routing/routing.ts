import { defineRouting } from "next-intl/routing";

// Every URL starts with the language (/en/users, /pl/users). The `locale` cookie remembers the last one,
// so a link without a language opens in it (PLAN D27). https://next-intl.dev/docs/routing/configuration
export const routing = defineRouting({
  locales: ["en", "pl"],
  defaultLocale: "en",
  localePrefix: "always",
  localeCookie: { name: "locale", maxAge: 60 * 60 * 24 * 365 },
});
