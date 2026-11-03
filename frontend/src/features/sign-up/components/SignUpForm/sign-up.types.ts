import type { Messages } from "next-intl";

export type SignUpField = "email" | "password" | "confirmPassword";

export type SignUpValues = Record<SignUpField, string>;

// A key of `signUp.errors` in messages/*.json. The utils stay pure; the form translates the key.
export type SignUpErrorKey = keyof Messages["signUp"]["errors"];

export type SignUpErrors = Partial<Record<SignUpField, SignUpErrorKey>>;

// A failed request. `field` is set when the message belongs under one input, otherwise it is shown above the button.
export type SignUpFailure = { field: "email" | null; errorKey: SignUpErrorKey };
