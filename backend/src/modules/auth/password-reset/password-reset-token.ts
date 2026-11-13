import { createHmac, randomBytes } from "node:crypto";
import { PASSWORD_RESET_VALID_HOURS } from "../../mail";

/** How long a reset link works (D20). The mail text names the same time. */
export const PASSWORD_RESET_TOKEN_TTL_MS = PASSWORD_RESET_VALID_HOURS * 60 * 60 * 1000;

/** A random token for the reset link: 32 bytes from the secure random generator, safe to put in a URL. */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * The value stored in the database. Keyed with a secret, so a leaked table cannot be used to
 * build a working reset link. The prefix keeps it apart from the other hashes made with the same secret.
 */
export function hashPasswordResetToken(token: string, secret: string): string {
  return createHmac("sha256", secret).update(`password-reset:${token}`).digest("hex");
}
