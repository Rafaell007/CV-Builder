import { CombinedGraphQLErrors } from "@apollo/client";
import type { ForgotPasswordErrorKey } from "../forgot-password.types";

// Turns an error of the forgotPassword mutation into the message key the user sees.
// The backend answers the same for known and unknown emails, so no error says anything about the account.
export function toForgotPasswordFailure(error: unknown): ForgotPasswordErrorKey {
  if (CombinedGraphQLErrors.is(error)) {
    const code = error.errors[0]?.extensions?.["code"];

    if (code === "TOO_MANY_REQUESTS") return "tooManyRequests";
    if (code === "BAD_USER_INPUT") return "invalidInput";
  }
  return "unexpected";
}
