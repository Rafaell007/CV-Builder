import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toResendFailure } from "./resend-code.utils";

function backendError(code: string, reason?: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [{ message: "failed", extensions: { code, ...(reason && { reason }) } }],
  });
}

describe("toResendFailure", () => {
  it.each([
    ["the resend cooldown", backendError("TOO_MANY_REQUESTS", "RESEND_COOLDOWN")],
    ["the throttler", backendError("TOO_MANY_REQUESTS")],
  ])("asks the user to wait for %s", (_name, error) => {
    expect(toResendFailure(error)).toBe("cooldown");
  });

  it("recognises an account that is verified already", () => {
    expect(toResendFailure(backendError("CONFLICT", "ALREADY_VERIFIED"))).toBe("alreadyVerified");
  });

  it("maps every other error to the generic failure", () => {
    expect(toResendFailure(backendError("INTERNAL_SERVER_ERROR"))).toBe("failed");
    expect(toResendFailure(new Error("Failed to fetch"))).toBe("failed");
  });
});
