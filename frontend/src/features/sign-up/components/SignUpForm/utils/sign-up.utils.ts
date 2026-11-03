import { CombinedGraphQLErrors } from "@apollo/client";
import type { SignUpErrors, SignUpFailure, SignUpValues } from "../sign-up.types";

// Same limits as the backend's SignUpInput, which checks them again (sign-up page AC-14).
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least one letter and one digit (D33). Sign-in does not check it, so older passwords still work.
const LETTER_AND_DIGIT_PATTERN = /^(?=.*\p{L})(?=.*\d)/u;

// The first problem of each field, as a message key; a field without an entry is valid.
export function validateSignUp({ email, password, confirmPassword }: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};
  const trimmedEmail = email.trim();

  if (trimmedEmail === "") errors.email = "emailRequired";
  else if (trimmedEmail.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "emailInvalid";
  }

  if (password === "") errors.password = "passwordRequired";
  else if (password.length < PASSWORD_MIN_LENGTH) errors.password = "passwordTooShort";
  else if (password.length > PASSWORD_MAX_LENGTH) errors.password = "passwordTooLong";
  else if (!LETTER_AND_DIGIT_PATTERN.test(password)) errors.password = "passwordWeak";

  if (confirmPassword === "") errors.confirmPassword = "confirmRequired";
  else if (confirmPassword !== password) errors.confirmPassword = "confirmMismatch";

  return errors;
}

// Turns an error of the signUp mutation into the message key the user sees. The password is never part of it.
export function toSignUpFailure(error: unknown): SignUpFailure {
  if (CombinedGraphQLErrors.is(error)) {
    switch (error.errors[0]?.extensions?.["code"]) {
      case "CONFLICT":
        return { field: "email", errorKey: "emailTaken" };
      case "TOO_MANY_REQUESTS":
        return { field: null, errorKey: "tooManyRequests" };
      case "BAD_USER_INPUT":
        return { field: null, errorKey: "invalidInput" };
    }
  }
  return { field: null, errorKey: "unexpected" };
}
