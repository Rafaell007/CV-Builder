import { CombinedGraphQLErrors } from "@apollo/client";
import type { VerifyEmailErrorKey, VerifyEmailFailure } from "../verify-email.types";

const CODE_PATTERN = /^\d{6}$/; // the backend code has exactly 6 digits (D20)

// The problem of the code as a message key, or undefined when the code looks right.
// Only the shape is checked (verification page AC): the backend decides if the code is valid or expired.
export function validateCode(code: string): VerifyEmailErrorKey | undefined {
  if (code === "") return "codeRequired";
  return CODE_PATTERN.test(code) ? undefined : "codeIncomplete";
}

// `extensions.reason` of the backend's verification errors (backend auth README).
const CODE_REASONS: Record<string, VerifyEmailErrorKey> = {
  CODE_INVALID: "codeInvalid",
  CODE_EXPIRED: "codeExpired",
  CODE_USED: "codeUsed",
  TOO_MANY_ATTEMPTS: "tooManyAttempts",
};

// Turns an error of the verifyEmail mutation into what the page shows. The code is never part of it.
export function toVerifyEmailFailure(error: unknown): VerifyEmailFailure {
  if (CombinedGraphQLErrors.is(error)) {
    const extensions = error.errors[0]?.extensions;
    const code = extensions?.["code"];
    const reason = extensions?.["reason"];
    const known = typeof reason === "string" ? CODE_REASONS[reason] : undefined;

    if (code === "CONFLICT" && reason === "ALREADY_VERIFIED") return "alreadyVerified";
    if (known !== undefined) return known;
    // The throttler answers TOO_MANY_REQUESTS without a reason.
    if (code === "TOO_MANY_REQUESTS") return "tooManyRequests";
  }
  return "unexpected";
}
