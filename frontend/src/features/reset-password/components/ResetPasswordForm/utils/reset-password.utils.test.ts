import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import {
  isTokenError,
  toResetPasswordFailure,
  validateResetPassword,
} from "./reset-password.utils";

function graphQLError(code: string, reason?: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [{ message: "failed", extensions: { code, ...(reason && { reason }) } }],
  });
}

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

describe("toResetPasswordFailure", () => {
  it.each([
    ["RESET_TOKEN_INVALID", "tokenInvalid"],
    ["RESET_TOKEN_EXPIRED", "tokenExpired"],
    ["RESET_TOKEN_USED", "tokenUsed"],
    ["SOMETHING_ELSE", "invalidInput"],
  ])("maps the reason %s to %s", (reason, key) => {
    expect(toResetPasswordFailure(graphQLError("BAD_USER_INPUT", reason))).toBe(key);
  });

  it("maps BAD_USER_INPUT without a reason to invalidInput", () => {
    expect(toResetPasswordFailure(graphQLError("BAD_USER_INPUT"))).toBe("invalidInput");
  });

  it("maps a throttled request", () => {
    expect(toResetPasswordFailure(graphQLError("TOO_MANY_REQUESTS"))).toBe("tooManyRequests");
  });

  it.each([graphQLError("INTERNAL_SERVER_ERROR"), new Error("Failed to fetch")])(
    "maps any other error to unexpected",
    (error) => {
      expect(toResetPasswordFailure(error)).toBe("unexpected");
    },
  );
});

describe("isTokenError", () => {
  it("is true only for the three token keys", () => {
    expect(isTokenError("tokenExpired")).toBe(true);
    expect(isTokenError("unexpected")).toBe(false);
  });
});
