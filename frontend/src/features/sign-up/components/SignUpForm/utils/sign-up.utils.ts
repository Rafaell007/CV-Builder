import { CombinedGraphQLErrors } from "@apollo/client";
import { emailProblem, passwordProblem } from "@/shared/utils";
import type { SignUpErrors, SignUpFailure, SignUpValues } from "../sign-up.types";

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

// Turns an error of the signUp mutation into the message key the user sees. The password is never part of it.
export function toSignUpFailure(error: unknown): SignUpFailure {
  if (CombinedGraphQLErrors.is(error)) {
    const extensions = error.errors[0]?.extensions;
    const code = extensions?.["code"];

    if (code === "CONFLICT" && extensions?.["reason"] === EMAIL_TAKEN_REASON) {
      return { field: "email", errorKey: "emailTaken" };
    }
    if (code === "TOO_MANY_REQUESTS") return { field: null, errorKey: "tooManyRequests" };
    if (code === "BAD_USER_INPUT") return { field: null, errorKey: "invalidInput" };
  }
  // Includes a CONFLICT with another reason: the user cannot fix it by changing the email.
  return { field: null, errorKey: "unexpected" };
}
