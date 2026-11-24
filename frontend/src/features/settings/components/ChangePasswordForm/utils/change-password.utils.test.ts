import { describe, expect, it } from "vitest";
import { validateChangePassword } from "./change-password.utils";

const PASSWORD = "Password123!";
const VALID = { currentPassword: "OldPassword1", newPassword: PASSWORD, confirmPassword: PASSWORD };

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

  it("refuses a new password that equals the current one", () => {
    expect(validateChangePassword({ ...VALID, currentPassword: PASSWORD })).toEqual({
      newPassword: "newPasswordSame",
    });
  });

  it("names the rule problem first when the reused password also breaks a rule", () => {
    expect(
      validateChangePassword({
        currentPassword: "short1",
        newPassword: "short1",
        confirmPassword: "short1",
      }),
    ).toEqual({ newPassword: "newPasswordTooShort" });
  });
});
