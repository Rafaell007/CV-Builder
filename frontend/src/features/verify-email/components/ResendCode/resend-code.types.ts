// What a failed resendVerificationCode request means. "alreadyVerified" is not shown: the page leaves instead.
export type ResendFailure = "cooldown" | "failed" | "alreadyVerified";

// What the user sees under the button.
export type ResendMessage = "sent" | "cooldown" | "failed";
