import { CombinedGraphQLErrors } from "@apollo/client";
import type { ResendFailure } from "../resend-code.types";

// Turns an error of the resendVerificationCode mutation into what the page does (backend auth README).
export function toResendFailure(error: unknown): ResendFailure {
  if (CombinedGraphQLErrors.is(error)) {
    const extensions = error.errors[0]?.extensions;
    const code = extensions?.["code"];
    const reason = extensions?.["reason"];

    if (code === "CONFLICT" && reason === "ALREADY_VERIFIED") return "alreadyVerified";
    // RESEND_COOLDOWN from the service, or the throttler's answer without a reason: both mean "wait".
    if (code === "TOO_MANY_REQUESTS") return "cooldown";
  }
  return "failed";
}
