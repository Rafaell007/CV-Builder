import { VERIFICATION_CODE_VALID_MINUTES } from "../../mail/templates/verification-code.template";
import {
  generateVerificationCode,
  hashesMatch,
  hashVerificationCode,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_RESEND_COOLDOWN_MS,
} from "./verification-code";

describe("verification code", () => {
  it("uses the values of D20", () => {
    expect(VERIFICATION_CODE_TTL_MS).toBe(10 * 60 * 1000);
    expect(VERIFICATION_RESEND_COOLDOWN_MS).toBe(60 * 1000);
    expect(VERIFICATION_MAX_ATTEMPTS).toBe(5);
  });

  it("agrees with the validity time that the mail text names", () => {
    expect(VERIFICATION_CODE_TTL_MS).toBe(VERIFICATION_CODE_VALID_MINUTES * 60 * 1000);
  });

  it("generates exactly 6 digits, also when the number is small", () => {
    for (let run = 0; run < 200; run++) {
      expect(generateVerificationCode()).toMatch(/^\d{6}$/);
    }
  });

  it("hashes the same code to the same value, and different codes or secrets to different values", () => {
    const hash = hashVerificationCode("123456", "secret-a");

    expect(hashVerificationCode("123456", "secret-a")).toBe(hash);
    expect(hashVerificationCode("123457", "secret-a")).not.toBe(hash);
    expect(hashVerificationCode("123456", "secret-b")).not.toBe(hash);
    expect(hash).not.toContain("123456");
  });

  it("compares hashes, also when their lengths differ", () => {
    expect(hashesMatch("abc", "abc")).toBe(true);
    expect(hashesMatch("abc", "abd")).toBe(false);
    expect(hashesMatch("abc", "abcd")).toBe(false);
  });
});
