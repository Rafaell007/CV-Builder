import type { Messages } from "next-intl";

// A key of `forgotPassword.errors` in messages/*.json. The utils stay pure; the form translates the key.
export type ForgotPasswordErrorKey = keyof Messages["forgotPassword"]["errors"];
