import { CombinedGraphQLErrors } from "@apollo/client";
import { z } from "zod";
import { MAX_CATALOG_NAME_LENGTH } from "../catalogs.constants";
import type { CatalogNameFormValues } from "../catalogs.types";

/** The translated texts of the name rules. */
export interface CatalogNameMessages {
  nameRequired: string;
  nameTooLong: string;
}

/**
 * The rules of the name form (Create and Update): required and at most 100 characters, like the backend.
 * The name is trimmed, so a name of spaces counts as empty. The backend checks everything again, and it alone knows whether the name is taken.
 */
export function catalogNameSchema(
  messages: CatalogNameMessages,
): z.ZodType<CatalogNameFormValues, CatalogNameFormValues> {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, messages.nameRequired)
      .max(MAX_CATALOG_NAME_LENGTH, messages.nameTooLong),
  });
}

/**
 * True when the backend refused the request with `CONFLICT`. For departments and positions it has one cause per request
 * (backend READMEs): on create or update the name is taken; on delete the item is in use.
 */
export function isCatalogConflict(error: unknown): boolean {
  if (!CombinedGraphQLErrors.is(error)) return false;
  return error.errors.some((item) => item.extensions?.["code"] === "CONFLICT");
}
