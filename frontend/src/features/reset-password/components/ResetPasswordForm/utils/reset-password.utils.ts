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

export function isTokenError(key: ResetPasswordErrorKey): key is ResetPasswordTokenErrorKey {
  return key === "tokenInvalid" || key === "tokenExpired" || key === "tokenUsed";
}
