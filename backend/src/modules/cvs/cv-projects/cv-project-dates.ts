import { ValidationFailedException } from "../../../common/errors";
import type { FieldError } from "../../../common/errors";
import { toDateOnly } from "../../projects/project-dates";

/** The codes of the date rule. The frontend maps each one to a translated text, so a rename is a contract change. */
export const CvProjectDateReason = {
  StartOutsideProject: "START_OUTSIDE_PROJECT",
  EndOutsideProject: "END_OUTSIDE_PROJECT",
  EndBeforeStart: "END_BEFORE_START",
} as const;
type CvProjectDateReason = (typeof CvProjectDateReason)[keyof typeof CvProjectDateReason];

const MESSAGE_BY_REASON: Record<CvProjectDateReason, string> = {
  START_OUTSIDE_PROJECT: "Start date must be within project duration",
  END_OUTSIDE_PROJECT: "End date must be within project duration",
  END_BEFORE_START: "End date cannot be earlier than start date",
};

function toFieldError(field: string, reasons: CvProjectDateReason[]): FieldError {
  return { field, messages: reasons.map((reason) => MESSAGE_BY_REASON[reason]), reasons };
}

/**
 * The dates of a CV project as stored: whole days (UTC), and an empty end date as `null`
 * ("Present"). They must stay within the dates of the project (CV projects page AC-15, AC-34, D25).
 * The error lists every broken rule, each with a `reason` code, so the form can show all of them at once.
 */
export function resolveCvProjectDates(
  { startDate, endDate }: { startDate: Date; endDate?: Date | null },
  project: { startDate: Date; endDate: Date },
): { startDate: Date; endDate: Date | null } {
  const start = toDateOnly(startDate);
  const end = endDate == null ? null : toDateOnly(endDate);
  const errors: FieldError[] = [];

  if (start < project.startDate || start > project.endDate) {
    errors.push(toFieldError("startDate", [CvProjectDateReason.StartOutsideProject]));
  }
  if (end !== null) {
    const reasons: CvProjectDateReason[] = [];
    if (end < start) reasons.push(CvProjectDateReason.EndBeforeStart);
    if (end < project.startDate || end > project.endDate) {
      reasons.push(CvProjectDateReason.EndOutsideProject);
    }
    if (reasons.length > 0) errors.push(toFieldError("endDate", reasons));
  }

  if (errors.length > 0) throw new ValidationFailedException(errors);
  return { startDate: start, endDate: end };
}
