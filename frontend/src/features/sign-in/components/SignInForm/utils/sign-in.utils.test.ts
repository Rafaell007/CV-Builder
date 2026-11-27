import { describe, expect, it } from "vitest";
import { createSignInSchema } from "./sign-in.utils";

const messages = {
  emailRequired: "Email is required",
  emailInvalid: "Please enter a valid email address",
  passwordRequired: "Password is required",
  passwordTooShort: "Password must be at least 6 characters long",
};
const schema = createSignInSchema(messages);

function messagesOf(values: { email: string; password: string }): string[] {
  const result = schema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("createSignInSchema", () => {
  it("accepts a valid email and a password of 6 characters", () => {
    expect(schema.safeParse({ email: "user@example.com", password: "123456" }).success).toBe(true);
  });

  it("asks for the email when it is empty or only spaces", () => {
    expect(messagesOf({ email: "", password: "123456" })).toEqual([messages.emailRequired]);
    expect(messagesOf({ email: "   ", password: "123456" })).toEqual([messages.emailRequired]);
  });

  it("rejects an email that is not an address", () => {
    expect(messagesOf({ email: "user@", password: "123456" })).toEqual([messages.emailInvalid]);
    expect(messagesOf({ email: "user.example.com", password: "123456" })).toEqual([
      messages.emailInvalid,
    ]);
  });

  it("removes spaces around the email", () => {
    const result = schema.safeParse({ email: " user@example.com ", password: "123456" });

    expect(result.data?.email).toBe("user@example.com");
  });

  it("asks for the password when it is empty", () => {
    expect(messagesOf({ email: "user@example.com", password: "" })).toEqual([
      messages.passwordRequired,
    ]);
  });

  it("rejects a password shorter than 6 characters", () => {
    expect(messagesOf({ email: "user@example.com", password: "12345" })).toEqual([
      messages.passwordTooShort,
    ]);
  });

  it("keeps spaces in the password", () => {
    const result = schema.safeParse({ email: "user@example.com", password: "  abcd  " });

    expect(result.data?.password).toBe("  abcd  ");
  });
});
