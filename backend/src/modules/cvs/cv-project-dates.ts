import { ValidationFailedException } from "../../common/errors";
import type { FieldError } from "../../common/errors";
import { toDateOnly } from "../projects/project-dates";

const START_OUTSIDE = "Start date must be within project duration";
const END_OUTSIDE = "End date must be within project duration";
const END_BEFORE_START = "End date cannot be earlier than start date";

/**
 * The dates of a CV project as stored: whole days (UTC), and an empty end date as `null`
 * ("Present"). They must stay within the dates of the project (CV projects page AC-15, AC-34, D25).
 * The error lists every broken rule, so the form can show all of them at once.
 */
export function resolveCvProjectDates(
  { startDate, endDate }: { startDate: Date; endDate?: Date | null },
  project: { startDate: Date; endDate: Date },
): { startDate: Date; endDate: Date | null } {
  const start = toDateOnly(startDate);
  const end = endDate == null ? null : toDateOnly(endDate);
  const errors: FieldError[] = [];

  if (start < project.startDate || start > project.endDate) {
    errors.push({ field: "startDate", messages: [START_OUTSIDE] });
  }
  if (end !== null) {
    const messages: string[] = [];
    if (end < start) messages.push(END_BEFORE_START);
    if (end < project.startDate || end > project.endDate) messages.push(END_OUTSIDE);
    if (messages.length > 0) errors.push({ field: "endDate", messages });
  }

  if (errors.length > 0) throw new ValidationFailedException(errors);
  return { startDate: start, endDate: end };
}
