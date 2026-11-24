import { z } from "zod";
import { MAX_CATALOG_NAME_LENGTH } from "../catalogs.constants";
import type { CatalogNameFormValues } from "../catalogs.types";

/** The translated texts of the name rules. */
export interface CatalogNameMessages {
  nameRequired: string;
  nameTooLong: string;
}

/**
 * The rule of a catalog name (departments, positions, skills): required and at most 100 characters, like the backend.
 * The name is trimmed, so a name of spaces counts as empty. The backend checks everything again, and it alone knows whether the name is taken.
 */
export function catalogNameRule(messages: CatalogNameMessages) {
  return z
    .string()
    .trim()
    .min(1, messages.nameRequired)
    .max(MAX_CATALOG_NAME_LENGTH, messages.nameTooLong);
}

/** The rules of the one-field name form (Create and Update department or position). */
export function catalogNameSchema(
  messages: CatalogNameMessages,
): z.ZodType<CatalogNameFormValues, CatalogNameFormValues> {
  return z.object({ name: catalogNameRule(messages) });
}
