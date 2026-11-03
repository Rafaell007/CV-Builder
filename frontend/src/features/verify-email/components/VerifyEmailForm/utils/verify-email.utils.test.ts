import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toVerifyEmailFailure, validateCode } from "./verify-email.utils";

function backendError(code: string, reason?: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [{ message: "failed", extensions: { code, ...(reason && { reason }) } }],
  });
}

describe("validateCode", () => {
  it("asks for a code when there is none", () => {
    expect(validateCode("")).toBe("codeRequired");
  });

  it.each(["1", "12345", "1234567", "12345a", "abcdef", "12 456"])(
    "refuses %j: not exactly 6 digits",
    (code) => {
      expect(validateCode(code)).toBe("codeIncomplete");
    },
  );

  it.each(["123456", "000000", "007007"])("accepts %s", (code) => {
    expect(validateCode(code)).toBeUndefined();
  });
});

describe("toVerifyEmailFailure", () => {
  it.each([
    ["CODE_INVALID", "codeInvalid"],
    ["CODE_EXPIRED", "codeExpired"],
    ["CODE_USED", "codeUsed"],
  ])("maps the BAD_USER_INPUT reason %s", (reason, key) => {
    expect(toVerifyEmailFailure(backendError("BAD_USER_INPUT", reason))).toBe(key);
  });

  it("maps too many tries for one code", () => {
    expect(toVerifyEmailFailure(backendError("TOO_MANY_REQUESTS", "TOO_MANY_ATTEMPTS"))).toBe(
      "tooManyAttempts",
    );
  });

  it("maps the throttler answer, which has no reason", () => {
    expect(toVerifyEmailFailure(backendError("TOO_MANY_REQUESTS"))).toBe("tooManyRequests");
  });

  it("recognises an account that is verified already", () => {
    expect(toVerifyEmailFailure(backendError("CONFLICT", "ALREADY_VERIFIED"))).toBe(
      "alreadyVerified",
    );
  });

  it("does not show an unknown reason, only the generic message", () => {
    expect(toVerifyEmailFailure(backendError("BAD_USER_INPUT", "SOMETHING_NEW"))).toBe(
      "unexpected",
    );
    expect(toVerifyEmailFailure(backendError("INTERNAL_SERVER_ERROR"))).toBe("unexpected");
  });

  it("maps a network error to the generic message", () => {
    expect(toVerifyEmailFailure(new Error("Failed to fetch"))).toBe("unexpected");
  });
});
