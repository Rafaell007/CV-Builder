import { z } from "zod";
import { catalogNameRule, type CatalogNameMessages } from "../../../utils";
import { LANGUAGE_ISO_PATTERN, MAX_LANGUAGE_ISO_LENGTH } from "../languages.constants";
import type { LanguageFormValues } from "../languages.types";

/** The translated texts of the language form rules. */
export interface LanguageFormMessages extends CatalogNameMessages {
  isoRequired: string;
  isoTooLong: string;
  isoInvalid: string;
  nativeNameRequired: string;
  nativeNameTooLong: string;
}

/**
 * The ISO code as it is sent and compared: trimmed, the letters a-z uppercase ("en " → "EN"). Like the backend, only
 * a-z: `toUpperCase()` would turn "ß" into "SS" and let a letter outside A-Z pass the pattern.
 */
export function normalizeIso(iso: string): string {
  return iso.trim().replace(/[a-z]/g, (letter) => letter.toUpperCase());
}

/**
 * The rules of the language form (Create and Update), like the backend: the name and the native name follow the
 * catalog name rule (required, at most 100 characters, trimmed); the ISO code is required, at most 5 characters,
 * uppercase letters with one optional hyphen. The backend checks everything again, and it alone knows what is taken.
 */
export function languageFormSchema(
  messages: LanguageFormMessages,
): z.ZodType<LanguageFormValues, LanguageFormValues> {
  return z.object({
    name: catalogNameRule(messages),
    iso: z
      .string()
      .overwrite(normalizeIso)
      .min(1, messages.isoRequired)
      .max(MAX_LANGUAGE_ISO_LENGTH, messages.isoTooLong)
      .regex(LANGUAGE_ISO_PATTERN, messages.isoInvalid),
    nativeName: catalogNameRule({
      nameRequired: messages.nativeNameRequired,
      nameTooLong: messages.nativeNameTooLong,
    }),
  });
}
