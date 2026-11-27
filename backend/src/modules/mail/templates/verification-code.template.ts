import type { MailContent } from "../mail-message";
import { escapeHtml } from "./escape-html";

/** How long a verification code works (D20). Shown in the mail text. */
export const VERIFICATION_CODE_VALID_MINUTES = 10;

/** The mail that carries the 6-digit code for the verification page. */
export function verificationCodeTemplate(code: string): MailContent {
  const safeCode = escapeHtml(code);

  return {
    subject: "Your CV Builder verification code",
    text: [
      "Welcome to CV Builder!",
      "",
      `Your verification code is: ${code}`,
      "",
      `The code is valid for ${VERIFICATION_CODE_VALID_MINUTES} minutes and works only once.`,
      "If you did not create an account, ignore this email.",
    ].join("\n"),
    html: [
      "<p>Welcome to CV Builder!</p>",
      `<p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${safeCode}</strong></p>`,
      `<p>The code is valid for ${VERIFICATION_CODE_VALID_MINUTES} minutes and works only once.</p>`,
      "<p>If you did not create an account, ignore this email.</p>",
    ].join("\n"),
  };
}
