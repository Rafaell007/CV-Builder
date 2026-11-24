import { z } from "zod";
import type { SignInValidationMessages } from "../sign-in.types";

export const MIN_PASSWORD_LENGTH = 6;

/** The sign-in rules (docs/pages/02-sign-in-page.md). The backend checks them again; this only saves a request. */
export function createSignInSchema(messages: SignInValidationMessages) {
  return z.object({
    // Trimmed, so a space pasted after the address does not fail the email check.
    email: z.string().trim().min(1, messages.emailRequired).pipe(z.email(messages.emailInvalid)),
    // Not trimmed: spaces can be part of a password.
    // pipe: an empty password gets only "required", not "too short" as well.
    password: z
      .string()
      .min(1, messages.passwordRequired)
      .pipe(z.string().min(MIN_PASSWORD_LENGTH, messages.passwordTooShort)),
  });
}
