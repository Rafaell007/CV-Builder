import type { Locale } from "next-intl";

/**
 * A picked day as the backend wants it: midnight UTC of the same calendar day. The date picker returns local
 * midnight, and `toISOString` of that is the day before in a time zone east of UTC. The backend keeps only the
 * UTC day (`toDateOnly`), so the user would see a date one day off.
 */
export function toUtcDateIso(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

/**
 * The reverse of `toUtcDateIso`: the calendar day the backend keeps (midnight UTC) as the local day the date
 * picker shows. `new Date(iso)` would show the day before in a time zone west of UTC. A value that is not a
 * date gives `null`, so the field is empty and the form asks for it.
 */
export function fromUtcDateIso(iso: string): Date | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Formats a calendar date for a table with the rules of the language: `04/15/2025` in English,
 * `15.04.2025` in Polish. A new language needs no change here.
 * The backend stores a calendar date (a DATE column) and sends it as midnight UTC, so the UTC parts are
 * read. The local time zone would show the day before in time zones west of UTC.
 * Returns `null` for a value that is not a date, so the caller can show that the date is missing.
 */
export function formatCalendarDate(value: string, locale: Locale): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
