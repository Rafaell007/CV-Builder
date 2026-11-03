import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { getErrorReason, getVerificationErrorMessage, validateCode } from "./verification.utils";

function backendError(reason?: string) {
  return new CombinedGraphQLErrors({
    errors: [{ message: "x", extensions: reason ? { reason } : {} }],
  });
}

describe("validateCode", () => {
  it("requires a code", () => {
    expect(validateCode("")).toBe("Verification code is required");
  });

  it.each(["12345", "1234567", "12345a", "12 456"])("rejects %s", (code) => {
    expect(validateCode(code)).toBe("Please enter a valid 6-digit code");
  });

  it("accepts exactly 6 digits", () => {
    expect(validateCode("012345")).toBeNull();
  });
});

describe("getErrorReason", () => {
  it("reads the reason of the first GraphQL error", () => {
    expect(getErrorReason(backendError("CODE_EXPIRED"))).toBe("CODE_EXPIRED");
  });

  it("returns null without a reason and for other errors", () => {
    expect(getErrorReason(backendError())).toBeNull();
    expect(getErrorReason(new Error("offline"))).toBeNull();
  });
});

describe("getVerificationErrorMessage", () => {
  it.each([
    ["CODE_INVALID", "Invalid verification code"],
    ["CODE_EXPIRED", "Verification code has expired"],
    ["CODE_USED", "Verification code has already been used"],
    ["TOO_MANY_ATTEMPTS", "Too many attempts. Request a new code"],
    ["RESEND_COOLDOWN", "Please wait before requesting another code"],
    ["ALREADY_VERIFIED", "Email is already verified"],
  ])("maps %s", (reason, message) => {
    expect(getVerificationErrorMessage(backendError(reason))).toBe(message);
  });

  it("hides unknown reasons and network errors behind the generic message", () => {
    const generic = "Something went wrong. Please try again later";
    expect(getVerificationErrorMessage(backendError("SECRET_DETAIL"))).toBe(generic);
    expect(getVerificationErrorMessage(new Error("offline"))).toBe(generic);
  });
});
