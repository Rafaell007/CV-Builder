import type { MailContent } from "../mail-message";
import { escapeHtml } from "./escape-html";

/** How long a reset link works (D20). Shown in the mail text. */
export const PASSWORD_RESET_VALID_HOURS = 1;

/** The Reset Password page reads the token from this query parameter. */
export function buildPasswordResetLink(frontendUrl: string, token: string): string {
  const url = new URL("/reset-password", frontendUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

/** The mail that carries the password reset link. */
export function passwordResetTemplate(link: string): MailContent {
  const safeLink = escapeHtml(link);

  return {
    subject: "Reset your CV Builder password",
    text: [
      "We received a request to reset your CV Builder password.",
      "",
      `Open this link to choose a new password: ${link}`,
      "",
      `The link is valid for ${PASSWORD_RESET_VALID_HOURS} hour and works only once.`,
      "If you did not ask for a reset, ignore this email. Your password stays the same.",
    ].join("\n"),
    html: [
      "<p>We received a request to reset your CV Builder password.</p>",
      `<p><a href="${safeLink}">Choose a new password</a></p>`,
      `<p>The link is valid for ${PASSWORD_RESET_VALID_HOURS} hour and works only once.</p>`,
      "<p>If you did not ask for a reset, ignore this email. Your password stays the same.</p>",
    ].join("\n"),
  };
}
