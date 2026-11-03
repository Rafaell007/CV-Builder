import type { Messages } from "next-intl";

export type ResetPasswordField = "newPassword" | "confirmPassword";

export type ResetPasswordValues = Record<ResetPasswordField, string>;

// A key of `resetPassword.errors` in messages/*.json. The utils stay pure; the form translates the key.
export type ResetPasswordErrorKey = keyof Messages["resetPassword"]["errors"];

export type ResetPasswordErrors = Partial<Record<ResetPasswordField, ResetPasswordErrorKey>>;

// The link cannot be used any more, so the form is replaced by a notice. The other keys leave the form in place.
export type ResetPasswordTokenErrorKey = "tokenInvalid" | "tokenExpired" | "tokenUsed";
