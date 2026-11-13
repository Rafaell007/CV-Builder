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

/** The translated texts of the validation messages (page 23, Add Project Validation). */
export interface CvProjectFormMessages {
  projectRequired: string;
  startDateRequired: string;
  startDateOutOfRange: string;
  endDateOutOfRange: string;
  endDateBeforeStart: string;
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
      const range = rangeOf(projectId);
      const outside = (date: Date) =>
        range !== undefined && (date < range.start || date > range.end);

      if (outside(startDate)) {
        context.addIssue({
          code: "custom",
          message: messages.startDateOutOfRange,
          path: ["startDate"],
        });
      }
      if (endDate === null) return;
      if (outside(endDate)) {
        context.addIssue({
          code: "custom",
          message: messages.endDateOutOfRange,
          path: ["endDate"],
        });
      } else if (endDate < startDate) {
        context.addIssue({
          code: "custom",
          message: messages.endDateBeforeStart,
          path: ["endDate"],
        });
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
