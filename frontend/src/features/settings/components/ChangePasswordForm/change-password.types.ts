import type { Messages } from "next-intl";

export type ChangePasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export type ChangePasswordValues = Record<ChangePasswordField, string>;

// A key of `settings.changePassword.errors` in messages/*.json. The utils stay pure; the form translates the key.
export type ChangePasswordErrorKey = keyof Messages["settings"]["changePassword"]["errors"];

export type ChangePasswordErrors = Partial<Record<ChangePasswordField, ChangePasswordErrorKey>>;
