import { CombinedGraphQLErrors } from "@apollo/client";
import type { SignUpErrors, SignUpFailure, SignUpValues } from "../sign-up.types";

// Same limits as the backend's SignUpInput, which checks them again (sign-up page AC-14).
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least one letter and one digit (D32). Sign-in does not check it, so older passwords still work.
const LETTER_AND_DIGIT_PATTERN = /^(?=.*\p{L})(?=.*\d)/u;

export const SIGN_UP_MESSAGES = {
  emailRequired: "Email is required",
  emailInvalid: "Please enter a valid email address",
  passwordRequired: "Password is required",
  passwordTooShort: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  passwordWeak: "Password must contain at least one letter and one digit",
  passwordTooLong: `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`,
  confirmRequired: "Confirm Password is required",
  confirmMismatch: "Passwords do not match",
  emailTaken: "An account with this email already exists",
  tooManyRequests: "Too many attempts, try again later",
  invalidInput: "Please check the entered values and try again",
  unexpected: "Something went wrong. Please try again later",
} as const;

// The first problem of each field; a field without an entry is valid.
export function validateSignUp({ email, password, confirmPassword }: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};
  const trimmedEmail = email.trim();

  if (trimmedEmail === "") errors.email = SIGN_UP_MESSAGES.emailRequired;
  else if (trimmedEmail.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = SIGN_UP_MESSAGES.emailInvalid;
  }

  if (password === "") errors.password = SIGN_UP_MESSAGES.passwordRequired;
  else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = SIGN_UP_MESSAGES.passwordTooShort;
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = SIGN_UP_MESSAGES.passwordTooLong;
  } else if (!LETTER_AND_DIGIT_PATTERN.test(password)) {
    errors.password = SIGN_UP_MESSAGES.passwordWeak;
  }

  if (confirmPassword === "") errors.confirmPassword = SIGN_UP_MESSAGES.confirmRequired;
  else if (confirmPassword !== password) errors.confirmPassword = SIGN_UP_MESSAGES.confirmMismatch;

  return errors;
}

// Turns an error of the signUp mutation into the text the user sees. The password is never part of it.
export function toSignUpFailure(error: unknown): SignUpFailure {
  if (CombinedGraphQLErrors.is(error)) {
    switch (error.errors[0]?.extensions?.["code"]) {
      case "CONFLICT":
        return { field: "email", message: SIGN_UP_MESSAGES.emailTaken };
      case "TOO_MANY_REQUESTS":
        return { field: null, message: SIGN_UP_MESSAGES.tooManyRequests };
      case "BAD_USER_INPUT":
        return { field: null, message: SIGN_UP_MESSAGES.invalidInput };
    }
  }
  return { field: null, message: SIGN_UP_MESSAGES.unexpected };
}
