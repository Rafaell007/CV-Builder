import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toForgotPasswordFailure } from "./forgot-password.utils";

function graphQlError(code: string) {
  return new CombinedGraphQLErrors({
    errors: [{ message: "failed", extensions: { code } }],
  });
}

describe("toForgotPasswordFailure", () => {
  it.each([
    ["TOO_MANY_REQUESTS", "tooManyRequests"],
    ["BAD_USER_INPUT", "invalidInput"],
    ["INTERNAL_SERVER_ERROR", "unexpected"],
  ])("maps %s to %s", (code, key) => {
    expect(toForgotPasswordFailure(graphQlError(code))).toBe(key);
  });

  it("maps a network error to unexpected", () => {
    expect(toForgotPasswordFailure(new Error("Failed to fetch"))).toBe("unexpected");
  });
});
