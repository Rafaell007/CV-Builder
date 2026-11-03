export type SignUpField = "email" | "password" | "confirmPassword";

export type SignUpValues = Record<SignUpField, string>;

export type SignUpErrors = Partial<Record<SignUpField, string>>;

// A failed request. `field` is set when the message belongs under one input, otherwise it is shown above the button.
export type SignUpFailure = { field: "email" | null; message: string };
