import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { routing } from "@/shared/i18n";
import { loadMessages } from "./loadMessages";

// next-intl reads this file (default path) for every Server Component render. The locale comes from the
// `[locale]` URL segment through `next/root-params`, so pages stay static under Cache Components.
// https://next-intl.dev/blog/nextjs-root-params
// An unknown segment (/xx/users) is a 404: `dynamicParams = false` does not work with Cache Components.
export default getRequestConfig(async () => {
  const locale: unknown = await rootParams.locale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return { locale, messages: await loadMessages(locale) };
});
