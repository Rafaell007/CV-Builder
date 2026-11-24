import { z } from "zod";
import type { AddCvProjectInput, UpdateCvProjectInput } from "@/shared/graphql";
import { fromUtcDateIso, toUtcDateIso } from "@/shared/utils";
import { MAX_RESPONSIBILITIES_LENGTH, MAX_ROLES } from "../cvProjects.constants";
import type {
  CatalogProject,
  CvProjectFormSubmit,
  CvProjectFormValues,
  CvProjectItem,
  ProjectRange,
} from "../cvProjects.types";
import {
  toCvProjectDateReasons,
  toCvProjectDateText,
  type CvProjectDateTexts,
} from "./cvProjectDates.utils";

/** The translated texts of the validation messages (page 23, Add Project Validation). */
export interface CvProjectFormMessages {
  projectRequired: string;
  startDateRequired: string;
  dateTexts: CvProjectDateTexts;
  rolesRequired: string;
  rolesTooMany: string;
  responsibilitiesTooLong: string;
}

/** What the form holds before a project is chosen: nothing, and an empty Roles field. */
export const EMPTY_CV_PROJECT_FORM_VALUES: CvProjectFormValues = {
  projectId: "",
  startDate: null,
  endDate: null,
  roleIds: [],
  responsibilities: "",
};

/**
 * The days a catalog project lasts, as local days (the date picker shows local days). `undefined` when the project
 * has no readable date: the form then cannot check the range, and the backend decides.
 */
export function toProjectRange(
  project: Pick<CatalogProject, "startDate" | "endDate">,
): ProjectRange | undefined {
  const start = fromUtcDateIso(project.startDate);
  const end = fromUtcDateIso(project.endDate);
  return start && end ? { start, end } : undefined;
}

/** The limits of the two date pickers: the days of the project, and each picker also stops at the other date. */
export interface DateLimits {
  startMax: Date | undefined;
  endMin: Date | undefined;
}

/**
 * Start Date may not pass the End Date and End Date may not come before the Start Date, inside the days of the
 * project. An empty side sets no limit. Without this the End Date calendar offers days that the form rule then
 * rejects ("End date cannot be earlier than start date").
 */
export function toDateLimits(
  range: ProjectRange | undefined,
  startDate: Date | null,
  endDate: Date | null,
): DateLimits {
  const latest = (a: Date | undefined, b: Date | null) =>
    a && b ? (a < b ? a : b) : (a ?? b ?? undefined);
  const earliest = (a: Date | undefined, b: Date | null) =>
    a && b ? (a > b ? a : b) : (a ?? b ?? undefined);
  return { startMax: latest(range?.end, endDate), endMin: earliest(range?.start, startDate) };
}

// The date picker holds `null` while empty and when the typed text is not a date, so one message covers both.
const requiredDate = (message: string) =>
  z
    .date()
    .nullable()
    .transform((date, context) => {
      if (date) return date;
      context.addIssue({ code: "custom", message });
      return z.NEVER;
    });

/**
 * The rules of the CV project form (Add and Update): a project is required, the start date is required, both
 * dates stay inside the days of the project, the end date is not earlier than the start date (the same day is
 * allowed, like the backend) and at least one role is chosen. The end date may stay empty (Present).
 * Responsibilities are optional. `rangeOf` gives the days of the chosen project; the form is rebuilt when the
 * catalog changes. The backend checks everything again. Texts are trimmed.
 */
export function cvProjectFormSchema(
  messages: CvProjectFormMessages,
  rangeOf: (projectId: string) => ProjectRange | undefined,
): z.ZodType<CvProjectFormSubmit, CvProjectFormValues> {
  return z
    .object({
      projectId: z.string().min(1, messages.projectRequired),
      startDate: requiredDate(messages.startDateRequired),
      endDate: z.date().nullable(),
      roleIds: z
        .array(z.string())
        .min(1, messages.rolesRequired)
        .max(MAX_ROLES, messages.rolesTooMany),
      responsibilities: z
        .string()
        .trim()
        .max(MAX_RESPONSIBILITIES_LENGTH, messages.responsibilitiesTooLong),
    })
    .superRefine(({ projectId, startDate, endDate }, context) => {
      const reasons = toCvProjectDateReasons({ startDate, endDate }, rangeOf(projectId));
      for (const field of ["startDate", "endDate"] as const) {
        const message = toCvProjectDateText(reasons[field], messages.dateTexts);
        if (message !== undefined) context.addIssue({ code: "custom", message, path: [field] });
      }
    });
}

/** The values the Update project form starts with: the current data of the CV project (page 23, Update Project). */
export function toCvProjectFormValues(cvProject: CvProjectItem): CvProjectFormValues {
  return {
    projectId: cvProject.project.id,
    startDate: fromUtcDateIso(cvProject.startDate),
    endDate: cvProject.endDate === null ? null : fromUtcDateIso(cvProject.endDate),
    roleIds: cvProject.roles.map((role) => role.id),
    responsibilities: cvProject.responsibilities ?? "",
  };
}

/** The `addCvProject` input. An empty end date or empty responsibilities are sent as `null`. */
export function toAddCvProjectInput(cvId: string, values: CvProjectFormSubmit): AddCvProjectInput {
  return {
    cvId,
    projectId: values.projectId,
    startDate: toUtcDateIso(values.startDate),
    endDate: values.endDate === null ? null : toUtcDateIso(values.endDate),
    responsibilities: values.responsibilities === "" ? null : values.responsibilities,
    roleIds: values.roleIds,
  };
}

/**
 * The `updateCvProject` input. The backend replaces all roles with `roleIds`, so the form value is sent. There is
 * no `projectId`: the project of an entry cannot change.
 */
export function toUpdateCvProjectInput(
  id: string,
  values: CvProjectFormSubmit,
): UpdateCvProjectInput {
  return {
    id,
    startDate: toUtcDateIso(values.startDate),
    endDate: values.endDate === null ? null : toUtcDateIso(values.endDate),
    responsibilities: values.responsibilities === "" ? null : values.responsibilities,
    roleIds: values.roleIds,
  };
}
