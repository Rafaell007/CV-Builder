import { CombinedGraphQLErrors } from "@apollo/client";
import { z } from "zod";
import type { SignInErrorKind, SignInValidationMessages } from "../sign-in.types";

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

/**
 * Sorts a failed request. The backend answers a wrong email and a wrong password the same way
 * (`UNAUTHENTICATED`), so the page cannot tell which one was wrong. Anything else is unexpected.
 */
export function getSignInErrorKind(error: unknown): SignInErrorKind {
  if (CombinedGraphQLErrors.is(error)) {
    const isRejected = error.errors.some((item) => item.extensions?.code === "UNAUTHENTICATED");
    if (isRejected) return "invalidCredentials";
  }
  return "unexpected";
}
