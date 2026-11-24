import { passwordProblem, type PasswordProblem } from "@/shared/utils";
import type {
  ChangePasswordErrorKey,
  ChangePasswordErrors,
  ChangePasswordField,
  ChangePasswordValues,
} from "../change-password.types";

// The shared D33 check returns generic keys; this form has its own texts for the new password.
const NEW_PASSWORD_ERRORS: Record<PasswordProblem, ChangePasswordErrorKey> = {
  passwordRequired: "newPasswordRequired",
  passwordTooShort: "newPasswordTooShort",
  passwordTooLong: "newPasswordTooLong",
  passwordWeak: "newPasswordWeak",
};

// The first problem of each field, as a message key; a field without an entry is valid.
// The backend checks the same rules again (decision D33).
export function validateChangePassword({
  currentPassword,
  newPassword,
  confirmPassword,
}: ChangePasswordValues): ChangePasswordErrors {
  const errors: ChangePasswordErrors = {};
  const problem = passwordProblem(newPassword);

  if (currentPassword === "") errors.currentPassword = "currentPasswordRequired";
  if (problem !== undefined) errors.newPassword = NEW_PASSWORD_ERRORS[problem];
  else if (newPassword === currentPassword) errors.newPassword = "newPasswordSame";

  if (confirmPassword === "") errors.confirmPassword = "confirmRequired";
  else if (confirmPassword !== newPassword) errors.confirmPassword = "confirmMismatch";

  return errors;
}

// Server failures shown under a field instead of under the form.
export const FIELD_FAILURES: Partial<Record<ChangePasswordErrorKey, ChangePasswordField>> = {
  currentPasswordIncorrect: "currentPassword",
  newPasswordSame: "newPassword",
};
