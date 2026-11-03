import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import * as rootParams from "next/root-params";
import { routing } from "@/shared/i18n";
import { loadMessages } from "./loadMessages";

// next-intl reads this file (default path) for every Server Component render. The locale comes from the
// `[locale]` URL segment through `next/root-params`, so pages stay static under Cache Components.
// https://next-intl.dev/blog/nextjs-root-params
export default getRequestConfig(async () => {
  const segment: unknown = await rootParams.locale();
  const locale = hasLocale(routing.locales, segment) ? segment : routing.defaultLocale;

  return { locale, messages: await loadMessages(locale) };
});
