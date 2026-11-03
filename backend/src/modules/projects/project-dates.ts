import { ValidationFailedException } from "../../common/errors";

/** Cuts a date to its calendar day (UTC), because the database stores project dates as `DATE`. */
export function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** The project dates as stored: whole days, and the end not before the start (projects page AC-19, AC-45). */
export function normalizeProjectDates(
  startDate: Date,
  endDate: Date,
): { startDate: Date; endDate: Date } {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (end < start) {
    throw new ValidationFailedException([
      { field: "endDate", messages: ["endDate must not be earlier than startDate"] },
    ]);
  }
  return { startDate: start, endDate: end };
}
