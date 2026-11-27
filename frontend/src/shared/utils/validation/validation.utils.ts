// Same limits as the backend inputs, which check them again (sign-up page AC-14).
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least one letter and one digit (D33). Sign-in does not check it, so older passwords still work.
const LETTER_AND_DIGIT_PATTERN = /^(?=.*\p{L})(?=.*\d)/u;

// Message keys, not texts: the caller translates them with its own messages.
export type EmailProblem = "emailRequired" | "emailInvalid";
export type PasswordProblem =
  "passwordRequired" | "passwordTooShort" | "passwordTooLong" | "passwordWeak";

// The first problem of the email, or undefined when it is valid. Spaces around it are ignored.
export function emailProblem(email: string): EmailProblem | undefined {
  const trimmed = email.trim();

  if (trimmed === "") return "emailRequired";
  if (trimmed.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(trimmed)) return "emailInvalid";
  return undefined;
}

// The first problem of a new password (D33), or undefined when it is valid.
export function passwordProblem(password: string): PasswordProblem | undefined {
  if (password === "") return "passwordRequired";
  if (password.length < PASSWORD_MIN_LENGTH) return "passwordTooShort";
  if (password.length > PASSWORD_MAX_LENGTH) return "passwordTooLong";
  if (!LETTER_AND_DIGIT_PATTERN.test(password)) return "passwordWeak";
  return undefined;
}
