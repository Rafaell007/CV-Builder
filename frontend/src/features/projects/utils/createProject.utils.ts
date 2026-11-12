import { z } from "zod";
import type { CreateProjectInput } from "@/shared/graphql";
import { MAX_DESCRIPTION_LENGTH, MAX_DOMAIN_LENGTH, MAX_NAME_LENGTH } from "../projects.constants";
import type { CreateProjectSubmit, CreateProjectValues } from "../projects.types";

/** The translated texts of the validation messages (page 27, Create Project Validation). */
export interface CreateProjectMessages {
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
export function createProjectSchema(
  messages: CreateProjectMessages,
): z.ZodType<CreateProjectSubmit, CreateProjectValues> {
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
export function toCreateProjectInput(values: CreateProjectSubmit): CreateProjectInput {
  return {
    name: values.name,
    domain: values.domain,
    startDate: toUtcDateIso(values.startDate),
    endDate: toUtcDateIso(values.endDate),
    description: values.description,
  };
}
