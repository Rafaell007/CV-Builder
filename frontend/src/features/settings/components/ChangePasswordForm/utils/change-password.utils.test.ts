import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toChangePasswordFailure, validateChangePassword } from "./change-password.utils";

const PASSWORD = "Password123!";
const VALID = { currentPassword: "OldPassword1", newPassword: PASSWORD, confirmPassword: PASSWORD };

function graphQLError(code: string, reason?: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [{ message: "failed", extensions: { code, ...(reason && { reason }) } }],
  });
}

describe("validateChangePassword", () => {
  it("accepts a current password and a valid, confirmed new one", () => {
    expect(validateChangePassword(VALID)).toEqual({});
  });

  it("asks for every field when they are empty", () => {
    expect(
      validateChangePassword({ currentPassword: "", newPassword: "", confirmPassword: "" }),
    ).toEqual({
      currentPassword: "currentPasswordRequired",
      newPassword: "newPasswordRequired",
      confirmPassword: "confirmRequired",
    });
  });

  it("does not apply the new-password rule to the current password", () => {
    // An older password may not follow D33; only the backend can say if it is right.
    expect(validateChangePassword({ ...VALID, currentPassword: "short" })).toEqual({});
  });

  it.each([
    ["Pass123", "newPasswordTooShort"],
    ["PasswordOnly", "newPasswordWeak"],
    ["12345678", "newPasswordWeak"],
    [`a1${"x".repeat(127)}`, "newPasswordTooLong"],
  ])("refuses the new password %j", (newPassword, key) => {
    expect(validateChangePassword({ ...VALID, newPassword, confirmPassword: newPassword })).toEqual(
      { newPassword: key },
    );
  });

  it("refuses a confirmation that does not match", () => {
    expect(validateChangePassword({ ...VALID, confirmPassword: "Password124!" })).toEqual({
      confirmPassword: "confirmMismatch",
    });
  });
});

describe("toChangePasswordFailure", () => {
  it("maps a wrong current password", () => {
    expect(
      toChangePasswordFailure(graphQLError("BAD_USER_INPUT", "CURRENT_PASSWORD_INCORRECT")),
    ).toBe("currentPasswordIncorrect");
  });

  it.each([undefined, "SOMETHING_ELSE"])(
    "maps other bad input (reason %s) to invalidInput",
    (reason) => {
      expect(toChangePasswordFailure(graphQLError("BAD_USER_INPUT", reason))).toBe("invalidInput");
    },
  );

  it("maps a throttled request", () => {
    expect(toChangePasswordFailure(graphQLError("TOO_MANY_REQUESTS"))).toBe("tooManyRequests");
  });

  it.each([graphQLError("INTERNAL_SERVER_ERROR"), new Error("Failed to fetch")])(
    "maps any other error to unexpected",
    (error) => {
      expect(toChangePasswordFailure(error)).toBe("unexpected");
    },
  );
});
