import type { ProjectRange } from "../cvProjects.types";

/**
 * The codes of the date rule. They are the `reasons` that the backend sends in `fieldErrors`
 * (`backend/src/modules/cvs/cv-projects/cv-project-dates.ts`), so a rename is a contract change.
 */
export const CV_PROJECT_DATE_REASONS = [
  "START_OUTSIDE_PROJECT",
  "END_OUTSIDE_PROJECT",
  "END_BEFORE_START",
] as const;

export type CvProjectDateReason = (typeof CV_PROJECT_DATE_REASONS)[number];

/** The translated text of each code. A `Record` makes a new code fail the build until it has a text. */
export type CvProjectDateTexts = Record<CvProjectDateReason, string>;

export function isCvProjectDateReason(value: string): value is CvProjectDateReason {
  return (CV_PROJECT_DATE_REASONS as readonly string[]).includes(value);
}

/** The reasons that each date field breaks. A list is empty when the field is fine. */
export interface CvProjectDateReasons {
  startDate: CvProjectDateReason[];
  endDate: CvProjectDateReason[];
}

// The stored day is a calendar day, so only the year, month and day count and the time of day does not.
const dayOf = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * The rule of the CV project dates, as the backend checks it (`resolveCvProjectDates`): both dates stay inside
 * the days of the project, and the end is not earlier than the start (the same day is allowed). An empty end
 * date (Present) breaks nothing. Every broken rule is listed, in the order of the backend. Without a `range`
 * (the project has no readable date) only the end-before-start rule can be checked and the backend decides the rest.
 */
export function toCvProjectDateReasons(
  { startDate, endDate }: { startDate: Date; endDate: Date | null },
  range: ProjectRange | undefined,
): CvProjectDateReasons {
  const outside = (date: Date) =>
    range !== undefined && (dayOf(date) < dayOf(range.start) || dayOf(date) > dayOf(range.end));

  const reasons: CvProjectDateReasons = { startDate: [], endDate: [] };
  if (outside(startDate)) reasons.startDate.push("START_OUTSIDE_PROJECT");
  if (endDate === null) return reasons;
  if (dayOf(endDate) < dayOf(startDate)) reasons.endDate.push("END_BEFORE_START");
  if (outside(endDate)) reasons.endDate.push("END_OUTSIDE_PROJECT");
  return reasons;
}

/**
 * The text for the codes of one field: the text of every code that the form knows, in order, one after the other.
 * `undefined` when no code is known (the server sent none, or a code that is newer than this form), so the caller
 * shows its general text for the field.
 */
export function toCvProjectDateText(
  reasons: readonly string[],
  texts: CvProjectDateTexts,
): string | undefined {
  const known = reasons.filter(isCvProjectDateReason).map((reason) => texts[reason]);
  return known.length > 0 ? known.join(". ") : undefined;
}
