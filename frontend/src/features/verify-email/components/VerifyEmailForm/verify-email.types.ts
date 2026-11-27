import type { Messages } from "next-intl";

// A key of `verifyEmail.errors` in messages/*.json. The utils stay pure; the form translates the key.
export type VerifyEmailErrorKey = keyof Messages["verifyEmail"]["errors"];

// What a failed verifyEmail request means: a message for the user, or "the account is verified already".
export type VerifyEmailFailure = VerifyEmailErrorKey | "alreadyVerified";
