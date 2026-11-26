const PERIOD_SEPARATOR = " – ";

function formatMonth(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${month}.${date.getUTCFullYear()}`;
}

/**
 * The period of a CV project as shown in the preview: `MM.YYYY – MM.YYYY`, or `MM.YYYY – Till now`
 * when the project has no end date (Figma screen of the CV preview, Projects Period). The caller gives
 * the word for "Till now" (`OPEN_PERIOD_WORDS` in `cv-locale.ts`, the only place with these words).
 */
export function formatPeriod(start: Date, end: Date | null, openPeriodWord: string): string {
  return `${formatMonth(start)}${PERIOD_SEPARATOR}${end === null ? openPeriodWord : formatMonth(end)}`;
}
