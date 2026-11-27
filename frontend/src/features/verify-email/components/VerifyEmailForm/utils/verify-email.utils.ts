import type { VerifyEmailErrorKey } from "../verify-email.types";

const CODE_PATTERN = /^\d{6}$/; // the backend code has exactly 6 digits (D20)

// The problem of the code as a message key, or undefined when the code looks right.
// Only the shape is checked (verification page AC): the backend decides if the code is valid or expired.
export function validateCode(code: string): VerifyEmailErrorKey | undefined {
  if (code === "") return "codeRequired";
  return CODE_PATTERN.test(code) ? undefined : "codeIncomplete";
}
