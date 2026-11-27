import { z } from "zod";
import type { CreateProjectInput, UpdateProjectInput } from "@/shared/graphql";
import { fromUtcDateIso, toUtcDateIso } from "@/shared/utils";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_DOMAIN_LENGTH,
  MAX_ENVIRONMENT_SKILLS,
  MAX_NAME_LENGTH,
} from "../projects.constants";
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
  environmentTooMany: string;
  environmentDuplicate: string;
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
 * The rules of the project form (Create and Update): name, domain, dates and description are required, the lengths are limited, and the end
 * date is not earlier than the start date (the same day is allowed, like the backend). The technologies are
 * optional: at most 50, each one once. The backend checks
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
      environmentIds: z
        .array(z.string())
        .max(MAX_ENVIRONMENT_SKILLS, messages.environmentTooMany)
        .refine((ids) => new Set(ids).size === ids.length, messages.environmentDuplicate),
    })
    .refine(({ startDate, endDate }) => endDate >= startDate, {
      message: messages.endDateBeforeStart,
      path: ["endDate"],
    });
}

/** The `createProject` input. `environmentIds` holds the technologies the user chose (an empty list for none). */
export function toCreateProjectInput(values: ProjectFormSubmit): CreateProjectInput {
  return {
    name: values.name,
    domain: values.domain,
    startDate: toUtcDateIso(values.startDate),
    endDate: toUtcDateIso(values.endDate),
    description: values.description,
    environmentIds: values.environmentIds,
  };
}

/** The values the Update project form starts with: the current data of the project (page 27, Edit Project Modal). */
export function toProjectFormValues(project: ProjectListItem): ProjectFormValues {
  return {
    name: project.name,
    domain: project.domain,
    startDate: fromUtcDateIso(project.startDate),
    endDate: fromUtcDateIso(project.endDate),
    description: project.description,
    environmentIds: project.environment.map((skill) => skill.id),
  };
}

/**
 * The `updateProject` input. The backend replaces the whole environment with `environmentIds`, so the form
 * value is sent, not the ids the project had when the list loaded: the user can change the technologies.
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
    environmentIds: values.environmentIds,
  };
}
