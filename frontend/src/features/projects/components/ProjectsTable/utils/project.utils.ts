import type { Locale } from "next-intl";

/**
 * Formats a project date for the table with the rules of the language: `04/15/2025` in English,
 * `15.04.2025` in Polish. A new language needs no change here.
 * The backend stores a calendar date (a DATE column) and sends it as midnight UTC, so the UTC parts are
 * read. The local time zone would show the day before in time zones west of UTC.
 * Returns `null` for a value that is not a date, so the caller can show that the date is missing.
 */
export function formatProjectDate(value: string, locale: Locale): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
