export type SignInValues = {
  email: string;
  password: string;
};

// What went wrong with a sign-in request; each kind has its own text.
export type SignInErrorKind = "invalidCredentials" | "unexpected";

// The validation texts, translated by the caller.
export type SignInValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordTooShort: string;
};
