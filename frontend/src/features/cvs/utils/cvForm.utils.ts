import { z } from "zod";
import type { CreateCvInput, UpdateCvInput } from "@/shared/graphql";
import { MAX_DESCRIPTION_LENGTH, MAX_EDUCATION_LENGTH, MAX_NAME_LENGTH } from "../cvs.constants";
import type { CvFormValues, CvListItem } from "../cvs.types";

/** The translated texts of the validation messages (page 20, Create CV Validation). */
export interface CvFormMessages {
  nameRequired: string;
  nameTooLong: string;
  educationRequired: string;
  educationTooLong: string;
  descriptionRequired: string;
  descriptionTooLong: string;
}

/**
 * The rules of the CV form (Create and Update): name, education and description are required and have a
 * length limit. Texts are trimmed, so a value of spaces counts as empty. The backend checks everything again.
 */
export function cvFormSchema(messages: CvFormMessages): z.ZodType<CvFormValues, CvFormValues> {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, messages.nameRequired)
      .max(MAX_NAME_LENGTH, messages.nameTooLong),
    education: z
      .string()
      .trim()
      .min(1, messages.educationRequired)
      .max(MAX_EDUCATION_LENGTH, messages.educationTooLong),
    description: z
      .string()
      .trim()
      .min(1, messages.descriptionRequired)
      .max(MAX_DESCRIPTION_LENGTH, messages.descriptionTooLong),
  });
}

/**
 * The `createCv` input. `userId` is sent only for the User CVs tab (the owner comes from the page, never from
 * the form); without it the backend uses the signed-in user as the owner and only an admin may send it.
 */
export function toCreateCvInput(values: CvFormValues, userId?: string): CreateCvInput {
  return {
    name: values.name,
    education: values.education,
    description: values.description,
    ...(userId === undefined ? {} : { userId }),
  };
}

/** The values the Update CV form starts with: the current data of the CV. */
export function toCvFormValues(cv: CvListItem): CvFormValues {
  return {
    name: cv.name,
    education: cv.education,
    description: cv.description,
  };
}

/** The `updateCv` input: the id of the CV and the checked form values. */
export function toUpdateCvInput(cv: CvListItem, values: CvFormValues): UpdateCvInput {
  return {
    id: cv.id,
    name: values.name,
    education: values.education,
    description: values.description,
  };
}
