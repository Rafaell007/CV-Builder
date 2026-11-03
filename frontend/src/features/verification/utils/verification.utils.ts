import { CombinedGraphQLErrors } from "@apollo/client";
import { CODE_LENGTH, GENERIC_ERROR } from "../verification.constants";

// `extensions.reason` values of verifyEmail and resendVerificationCode (backend auth README).
const REASON_MESSAGES: Record<string, string> = {
  CODE_INVALID: "Invalid verification code",
  CODE_EXPIRED: "Verification code has expired",
  CODE_USED: "Verification code has already been used",
  TOO_MANY_ATTEMPTS: "Too many attempts. Request a new code",
  RESEND_COOLDOWN: "Please wait before requesting another code",
  ALREADY_VERIFIED: "Email is already verified",
};

// Client-side check for the user's convenience only; the backend decides if a code is valid (AC-6).
export function validateCode(code: string): string | null {
  if (code === "") return "Verification code is required";
  if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) return "Please enter a valid 6-digit code";
  return null;
}

export function getErrorReason(error: unknown): string | null {
  if (!CombinedGraphQLErrors.is(error)) return null;
  const reason = error.errors[0]?.extensions?.["reason"];
  return typeof reason === "string" ? reason : null;
}

// A message for the user. Unknown reasons and network errors get the generic text, so no backend
// detail reaches the screen.
export function getVerificationErrorMessage(error: unknown): string {
  const reason = getErrorReason(error);
  return (reason && REASON_MESSAGES[reason]) || GENERIC_ERROR;
}
