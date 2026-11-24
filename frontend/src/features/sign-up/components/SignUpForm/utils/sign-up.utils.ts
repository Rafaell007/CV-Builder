import { emailProblem, passwordProblem } from "@/shared/utils";
import type { SignUpErrors, SignUpValues } from "../sign-up.types";

// The first problem of each field, as a message key; a field without an entry is valid.
// The email and password rules are shared with the other auth pages and the backend's SignUpInput (sign-up page AC-14).
export function validateSignUp({ email, password, confirmPassword }: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};
  const emailError = emailProblem(email);
  const passwordError = passwordProblem(password);

  if (emailError !== undefined) errors.email = emailError;
  if (passwordError !== undefined) errors.password = passwordError;

  if (confirmPassword === "") errors.confirmPassword = "confirmRequired";
  else if (confirmPassword !== password) errors.confirmPassword = "confirmMismatch";

  return errors;
}

// `extensions.reason` of the backend's CONFLICT for a taken email (backend auth README).
export const EMAIL_TAKEN_REASON = "EMAIL_TAKEN";
