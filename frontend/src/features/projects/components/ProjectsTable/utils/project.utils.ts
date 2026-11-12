import type { Locale } from "next-intl";

const pad = (value: number): string => String(value).padStart(2, "0");

/**
 * Formats a project date for the table: `MM/DD/YYYY` in English, `DD.MM.YYYY` in Polish.
 * The backend stores a calendar date (a DATE column) and sends it as midnight UTC, so the UTC parts are
 * read. The local time zone would show the day before in time zones west of UTC.
 * Returns an empty string for a value that is not a date.
 */
export function formatProjectDate(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const year = date.getUTCFullYear();

  return locale === "pl" ? `${day}.${month}.${year}` : `${month}/${day}/${year}`;
}
