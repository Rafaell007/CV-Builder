import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from "./password-reset-token";

describe("password reset token", () => {
  it("is valid for 1 hour (D20)", () => {
    expect(PASSWORD_RESET_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
  });

  it("generates a URL-safe token of 43 characters that differs on every call", () => {
    const first = generatePasswordResetToken();
    const second = generatePasswordResetToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
  });

  it("hashes the same token to the same value, and different tokens or secrets to different values", () => {
    const hash = hashPasswordResetToken("token-a", "secret-a");

    expect(hashPasswordResetToken("token-a", "secret-a")).toBe(hash);
    expect(hashPasswordResetToken("token-b", "secret-a")).not.toBe(hash);
    expect(hashPasswordResetToken("token-a", "secret-b")).not.toBe(hash);
  });

  it("stores a 64-character hex value", () => {
    expect(hashPasswordResetToken("token-a", "secret-a")).toMatch(/^[0-9a-f]{64}$/);
  });
});
