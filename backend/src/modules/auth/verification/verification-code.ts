import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/** How long a verification code works (D20). */
export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

/** The wait before a new code can be requested, counted from the creation of the last one (D20). */
export const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;

/** How many times one code can be tried. After that, the user must request a new code (D20). */
export const VERIFICATION_MAX_ATTEMPTS = 5;

/** A random 6-digit code from the secure random generator. Leading zeros are kept. */
export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * The value stored in the database. A plain hash of 6 digits can be reversed in a moment, so the hash
 * is keyed with a secret: a leaked table cannot be used to find the codes.
 */
export function hashVerificationCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(`verification:${code}`).digest("hex");
}

/** Compares two hashes in constant time. */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
