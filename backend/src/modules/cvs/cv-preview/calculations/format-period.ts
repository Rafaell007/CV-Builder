const PERIOD_SEPARATOR = " – ";
const PERIOD_PRESENT = "Till now";

function formatMonth(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${month}.${date.getUTCFullYear()}`;
}

/**
 * The period of a CV project as shown in the preview: `MM.YYYY – MM.YYYY`, or `MM.YYYY – Till now`
 * when the project has no end date (Figma screen of the CV preview, Projects Period).
 */
export function formatPeriod(start: Date, end: Date | null): string {
  return `${formatMonth(start)}${PERIOD_SEPARATOR}${end === null ? PERIOD_PRESENT : formatMonth(end)}`;
}
