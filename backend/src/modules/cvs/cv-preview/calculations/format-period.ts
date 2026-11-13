const PERIOD_SEPARATOR = " - ";
const PERIOD_PRESENT = "Present";

function formatMonth(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${month}.${date.getUTCFullYear()}`;
}

/**
 * The period of a CV project as shown in the preview: `MM.YYYY - MM.YYYY`, or `MM.YYYY - Present`
 * when the project has no end date (CV preview page, Projects Period).
 */
export function formatPeriod(start: Date, end: Date | null): string {
  return `${formatMonth(start)}${PERIOD_SEPARATOR}${end === null ? PERIOD_PRESENT : formatMonth(end)}`;
}
