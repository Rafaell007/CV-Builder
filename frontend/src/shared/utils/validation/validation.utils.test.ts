import { describe, expect, it } from "vitest";
import { emailProblem, passwordProblem } from "./validation.utils";

describe("emailProblem", () => {
  it("accepts a valid email and ignores spaces around it", () => {
    expect(emailProblem("  user@example.com ")).toBeUndefined();
  });

  it.each([
    ["", "emailRequired"],
    ["   ", "emailRequired"],
    ["not-an-email", "emailInvalid"],
    ["a@b", "emailInvalid"],
    [`${"a".repeat(250)}@example.com`, "emailInvalid"],
  ])("refuses %j", (email, problem) => {
    expect(emailProblem(email)).toBe(problem);
  });
});

describe("passwordProblem", () => {
  it("accepts 8 to 128 characters with a letter and a digit", () => {
    expect(passwordProblem("Password1")).toBeUndefined();
    expect(passwordProblem(`a1${"x".repeat(126)}`)).toBeUndefined();
  });

  it.each([
    ["", "passwordRequired"],
    ["Pass123", "passwordTooShort"],
    [`a1${"x".repeat(127)}`, "passwordTooLong"],
    ["PasswordOnly", "passwordWeak"],
    ["12345678", "passwordWeak"],
  ])("refuses %j", (password, problem) => {
    expect(passwordProblem(password)).toBe(problem);
  });
});
