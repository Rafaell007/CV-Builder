import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toSignUpFailure, validateSignUp } from "./sign-up.utils";

const VALID = {
  email: "new@example.com",
  password: "Password123!",
  confirmPassword: "Password123!",
};

function graphQLError(code: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({ errors: [{ message: "failed", extensions: { code } }] });
}

describe("validateSignUp", () => {
  it("accepts valid values", () => {
    expect(validateSignUp(VALID)).toEqual({});
  });

  it("requires every field", () => {
    expect(validateSignUp({ email: " ", password: "", confirmPassword: "" })).toEqual({
      email: "emailRequired",
      password: "passwordRequired",
      confirmPassword: "confirmRequired",
    });
  });

  it.each(["plain", "a@b", "a b@c.de", "@example.com", `${"a".repeat(251)}@b.co`])(
    "refuses the email %s",
    (email) => {
      expect(validateSignUp({ ...VALID, email }).email).toBe("emailInvalid");
    },
  );

  it("ignores spaces around a valid email", () => {
    expect(validateSignUp({ ...VALID, email: "  new@example.com " })).toEqual({});
  });

  it("checks the password length (8 to 128 characters)", () => {
    expect(validateSignUp({ ...VALID, password: "Pass123" }).password).toBe("passwordTooShort");
    expect(validateSignUp({ ...VALID, password: "Passw0rd", confirmPassword: "Passw0rd" })).toEqual(
      {},
    );
    expect(
      validateSignUp({
        ...VALID,
        password: `a1${"a".repeat(127)}`,
        confirmPassword: `a1${"a".repeat(127)}`,
      }).password,
    ).toBe("passwordTooLong");
  });

  it.each(["PasswordOnly", "12345678", "!!!!!!!!!"])(
    "requires a letter and a digit in the password %s",
    (password) => {
      expect(validateSignUp({ ...VALID, password, confirmPassword: password }).password).toBe(
        "passwordWeak",
      );
    },
  );

  it("requires the confirmation to match the password", () => {
    expect(validateSignUp({ ...VALID, confirmPassword: "Password123?" }).confirmPassword).toBe(
      "confirmMismatch",
    );
  });
});

describe("toSignUpFailure", () => {
  it("puts a taken email under the email field", () => {
    expect(toSignUpFailure(graphQLError("CONFLICT"))).toEqual({
      field: "email",
      errorKey: "emailTaken",
    });
  });

  it("explains a throttled request and invalid server input", () => {
    expect(toSignUpFailure(graphQLError("TOO_MANY_REQUESTS")).errorKey).toBe("tooManyRequests");
    expect(toSignUpFailure(graphQLError("BAD_USER_INPUT")).errorKey).toBe("invalidInput");
  });

  it("gives a friendly message for any other error", () => {
    expect(toSignUpFailure(graphQLError("INTERNAL_SERVER_ERROR"))).toEqual({
      field: null,
      errorKey: "unexpected",
    });
    expect(toSignUpFailure(new TypeError("Failed to fetch")).errorKey).toBe("unexpected");
  });
});
