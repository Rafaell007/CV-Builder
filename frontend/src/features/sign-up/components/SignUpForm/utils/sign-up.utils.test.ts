import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { SIGN_UP_MESSAGES, toSignUpFailure, validateSignUp } from "./sign-up.utils";

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
      email: SIGN_UP_MESSAGES.emailRequired,
      password: SIGN_UP_MESSAGES.passwordRequired,
      confirmPassword: SIGN_UP_MESSAGES.confirmRequired,
    });
  });

  it.each(["plain", "a@b", "a b@c.de", "@example.com", `${"a".repeat(251)}@b.co`])(
    "refuses the email %s",
    (email) => {
      expect(validateSignUp({ ...VALID, email }).email).toBe(SIGN_UP_MESSAGES.emailInvalid);
    },
  );

  it("ignores spaces around a valid email", () => {
    expect(validateSignUp({ ...VALID, email: "  new@example.com " })).toEqual({});
  });

  it("checks the password length (6 to 128 characters)", () => {
    expect(validateSignUp({ ...VALID, password: "12345" }).password).toBe(
      SIGN_UP_MESSAGES.passwordTooShort,
    );
    expect(
      validateSignUp({ ...VALID, password: "a".repeat(6), confirmPassword: "a".repeat(6) }),
    ).toEqual({});
    expect(
      validateSignUp({ ...VALID, password: "a".repeat(129), confirmPassword: "a".repeat(129) })
        .password,
    ).toBe(SIGN_UP_MESSAGES.passwordTooLong);
  });

  it("requires the confirmation to match the password", () => {
    expect(validateSignUp({ ...VALID, confirmPassword: "Password123?" }).confirmPassword).toBe(
      SIGN_UP_MESSAGES.confirmMismatch,
    );
  });
});

describe("toSignUpFailure", () => {
  it("puts a taken email under the email field", () => {
    expect(toSignUpFailure(graphQLError("CONFLICT"))).toEqual({
      field: "email",
      message: SIGN_UP_MESSAGES.emailTaken,
    });
  });

  it("explains a throttled request and invalid server input", () => {
    expect(toSignUpFailure(graphQLError("TOO_MANY_REQUESTS")).message).toBe(
      SIGN_UP_MESSAGES.tooManyRequests,
    );
    expect(toSignUpFailure(graphQLError("BAD_USER_INPUT")).message).toBe(
      SIGN_UP_MESSAGES.invalidInput,
    );
  });

  it("gives a friendly message for any other error", () => {
    expect(toSignUpFailure(graphQLError("INTERNAL_SERVER_ERROR"))).toEqual({
      field: null,
      message: SIGN_UP_MESSAGES.unexpected,
    });
    expect(toSignUpFailure(new TypeError("Failed to fetch")).message).toBe(
      SIGN_UP_MESSAGES.unexpected,
    );
  });
});
