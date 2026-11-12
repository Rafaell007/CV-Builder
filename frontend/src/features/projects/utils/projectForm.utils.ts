import { z } from "zod";
import type { CreateProjectInput, UpdateProjectInput } from "@/shared/graphql";
import { MAX_DESCRIPTION_LENGTH, MAX_DOMAIN_LENGTH, MAX_NAME_LENGTH } from "../projects.constants";
import type { ProjectFormSubmit, ProjectFormValues, ProjectListItem } from "../projects.types";

/** The translated texts of the validation messages (page 27, Create Project Validation). */
export interface ProjectFormMessages {
  nameRequired: string;
  nameTooLong: string;
  domainRequired: string;
  domainTooLong: string;
  startDateRequired: string;
  endDateRequired: string;
  endDateBeforeStart: string;
  descriptionRequired: string;
  descriptionTooLong: string;
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
 * The rules of the Create project form: all five fields are required, the lengths are limited, and the end
 * date is not earlier than the start date (the same day is allowed, like the backend). The backend checks
 * everything again. Texts are trimmed, so a name of spaces counts as empty.
 */
export function projectFormSchema(
  messages: ProjectFormMessages,
): z.ZodType<ProjectFormSubmit, ProjectFormValues> {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, messages.nameRequired)
        .max(MAX_NAME_LENGTH, messages.nameTooLong),
      domain: z
        .string()
        .trim()
        .min(1, messages.domainRequired)
        .max(MAX_DOMAIN_LENGTH, messages.domainTooLong),
      startDate: requiredDate(messages.startDateRequired),
      endDate: requiredDate(messages.endDateRequired),
      description: z
        .string()
        .trim()
        .min(1, messages.descriptionRequired)
        .max(MAX_DESCRIPTION_LENGTH, messages.descriptionTooLong),
    })
    .refine(({ startDate, endDate }) => endDate >= startDate, {
      message: messages.endDateBeforeStart,
      path: ["endDate"],
    });
}

/**
 * A picked day as the backend wants it: midnight UTC of the same calendar day. The date picker returns local
 * midnight, and `toISOString` of that is the day before in a time zone east of UTC. The backend keeps only the
 * UTC day (`toDateOnly`), so the user would see a project one day off.
 */
export function toUtcDateIso(date: Date): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

/** The `createProject` input. `environmentIds` is left out: the form has no Environment field yet (see the README). */
export function toCreateProjectInput(values: ProjectFormSubmit): CreateProjectInput {
  return {
    name: values.name,
    domain: values.domain,
    startDate: toUtcDateIso(values.startDate),
    endDate: toUtcDateIso(values.endDate),
    description: values.description,
  };
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

/** The values the Update project form starts with: the current data of the project (page 27, Edit Project Modal). */
export function toProjectFormValues(project: ProjectListItem): ProjectFormValues {
  return {
    name: project.name,
    domain: project.domain,
    startDate: fromUtcDateIso(project.startDate),
    endDate: fromUtcDateIso(project.endDate),
    description: project.description,
  };
}

/**
 * The `updateProject` input. The backend replaces the whole environment with `environmentIds` (and an
 * omitted list means "empty"), so the ids the project already has are sent back: the form has no Environment
 * field yet, and without them every edit would remove the technologies of the project.
 */
export function toUpdateProjectInput(
  project: ProjectListItem,
  values: ProjectFormSubmit,
): UpdateProjectInput {
  return {
    id: project.id,
    name: values.name,
    domain: values.domain,
    startDate: toUtcDateIso(values.startDate),
    endDate: toUtcDateIso(values.endDate),
    description: values.description,
    environmentIds: project.environment.map((skill) => skill.id),
  };
}
