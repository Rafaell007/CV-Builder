import { describe, expect, it } from "vitest";
import { isTokenError, validateResetPassword } from "./reset-password.utils";

describe("validateResetPassword", () => {
  it("accepts a valid password that is confirmed", () => {
    expect(
      validateResetPassword({ newPassword: "Password123!", confirmPassword: "Password123!" }),
    ).toEqual({});
  });

  it("asks for both fields when they are empty", () => {
    expect(validateResetPassword({ newPassword: "", confirmPassword: "" })).toEqual({
      newPassword: "passwordRequired",
      confirmPassword: "confirmRequired",
    });
  });

  it.each([
    ["Pass123", "passwordTooShort"],
    ["PasswordOnly", "passwordWeak"],
    ["12345678", "passwordWeak"],
    [`a1${"x".repeat(127)}`, "passwordTooLong"],
  ])("refuses the password %j", (newPassword, key) => {
    expect(validateResetPassword({ newPassword, confirmPassword: newPassword })).toEqual({
      newPassword: key,
    });
  });

  it("refuses a confirmation that does not match", () => {
    expect(
      validateResetPassword({ newPassword: "Password123!", confirmPassword: "Password124!" }),
    ).toEqual({ confirmPassword: "confirmMismatch" });
  });
});

describe("isTokenError", () => {
  it("is true only for the three token keys", () => {
    expect(isTokenError("tokenExpired")).toBe(true);
    expect(isTokenError("unexpected")).toBe(false);
  });
});
