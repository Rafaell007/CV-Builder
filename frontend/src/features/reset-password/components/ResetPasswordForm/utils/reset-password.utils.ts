import { CombinedGraphQLErrors } from "@apollo/client";
import { passwordProblem } from "@/shared/utils";
import type {
  ResetPasswordErrorKey,
  ResetPasswordErrors,
  ResetPasswordTokenErrorKey,
  ResetPasswordValues,
} from "../reset-password.types";

// The first problem of each field, as a message key; a field without an entry is valid.
// Same rule as the backend ResetPasswordInput, which checks it again (reset password page AC-5, D33).
export function validateResetPassword({
  newPassword,
  confirmPassword,
}: ResetPasswordValues): ResetPasswordErrors {
  const errors: ResetPasswordErrors = {};
  const problem = passwordProblem(newPassword);

  if (problem !== undefined) errors.newPassword = problem;

  if (confirmPassword === "") errors.confirmPassword = "confirmRequired";
  else if (confirmPassword !== newPassword) errors.confirmPassword = "confirmMismatch";

  return errors;
}

// `extensions.reason` of the backend's BAD_USER_INPUT for a token that cannot be used (backend auth README).
const TOKEN_REASONS: Record<string, ResetPasswordTokenErrorKey> = {
  RESET_TOKEN_INVALID: "tokenInvalid",
  RESET_TOKEN_EXPIRED: "tokenExpired",
  RESET_TOKEN_USED: "tokenUsed",
};

export function isTokenError(key: ResetPasswordErrorKey): key is ResetPasswordTokenErrorKey {
  return key === "tokenInvalid" || key === "tokenExpired" || key === "tokenUsed";
}

// Turns an error of the resetPassword mutation into the message key the user sees. The password is never part of it.
export function toResetPasswordFailure(error: unknown): ResetPasswordErrorKey {
  if (CombinedGraphQLErrors.is(error)) {
    const extensions = error.errors[0]?.extensions;
    const code = extensions?.["code"];
    const reason = extensions?.["reason"];

    if (code === "BAD_USER_INPUT") {
      return (typeof reason === "string" ? TOKEN_REASONS[reason] : undefined) ?? "invalidInput";
    }
    if (code === "TOO_MANY_REQUESTS") return "tooManyRequests";
  }
  return "unexpected";
}
