import { describe, expect, it } from "vitest";
import { alpha, emailOnly } from "../users.mocks";
import type { UserFormValues } from "../users.types";
import {
  createUserFormSchema,
  toCreateUserInput,
  toUpdateUserInput,
  toUserFormValues,
  updateUserFormSchema,
  type CreateUserFormMessages,
} from "./userForm.utils";

// Each message is its own key, so a test sees which rule failed.
const messages: CreateUserFormMessages = {
  emailRequired: "emailRequired",
  emailInvalid: "emailInvalid",
  passwordRequired: "passwordRequired",
  passwordTooShort: "passwordTooShort",
  passwordTooLong: "passwordTooLong",
  passwordWeak: "passwordWeak",
  firstNameRequired: "firstNameRequired",
  firstNameTooLong: "firstNameTooLong",
  lastNameRequired: "lastNameRequired",
  lastNameTooLong: "lastNameTooLong",
  departmentRequired: "departmentRequired",
  positionRequired: "positionRequired",
  roleRequired: "roleRequired",
};
const schema = createUserFormSchema(messages);

const valid: UserFormValues = {
  email: "new.user@example.com",
  password: "secret123",
  firstName: "Ada",
  lastName: "Lovelace",
  departmentId: "department-1",
  positionId: "position-1",
  role: "USER",
};

// The message of each failed field, as `{ field: message }`.
function errorsOf(values: Partial<UserFormValues>) {
  const result = schema.safeParse({ ...valid, ...values });
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("createUserFormSchema", () => {
  it("accepts a filled form and trims the texts, but not the password", () => {
    const result = schema.parse({
      ...valid,
      email: "  new.user@example.com ",
      password: " secret123 ",
      firstName: " Ada ",
      lastName: " Lovelace ",
    });
    expect(result).toEqual({
      ...valid,
      email: "new.user@example.com",
      password: " secret123 ",
      firstName: "Ada",
      lastName: "Lovelace",
    });
  });

  it("checks the email with the shared rule", () => {
    expect(errorsOf({ email: " " })).toEqual({ email: "emailRequired" });
    expect(errorsOf({ email: "not-an-email" })).toEqual({ email: "emailInvalid" });
  });

  it("checks the password with the D33 rule (8–128, a letter and a digit)", () => {
    expect(errorsOf({ password: "" })).toEqual({ password: "passwordRequired" });
    expect(errorsOf({ password: "abc123" })).toEqual({ password: "passwordTooShort" });
    expect(errorsOf({ password: `a1${"x".repeat(127)}` })).toEqual({
      password: "passwordTooLong",
    });
    expect(errorsOf({ password: "abcdefgh" })).toEqual({ password: "passwordWeak" });
  });

  it("requires the names, at most 100 characters each", () => {
    expect(errorsOf({ firstName: "  ", lastName: "" })).toEqual({
      firstName: "firstNameRequired",
      lastName: "lastNameRequired",
    });
    expect(errorsOf({ firstName: "x".repeat(101), lastName: "y".repeat(101) })).toEqual({
      firstName: "firstNameTooLong",
      lastName: "lastNameTooLong",
    });
    expect(errorsOf({ firstName: "x".repeat(100) })).toEqual({});
  });

  it("requires a department, a position and a role", () => {
    expect(errorsOf({ departmentId: "", positionId: "", role: "" })).toEqual({
      departmentId: "departmentRequired",
      positionId: "positionRequired",
      role: "roleRequired",
    });
  });
});

describe("toCreateUserInput", () => {
  it("sends every field", () => {
    const values = schema.parse(valid);
    expect(toCreateUserInput(values)).toEqual(values);
  });
});

describe("updateUserFormSchema", () => {
  const updateSchema = updateUserFormSchema(messages);
  // The Update form holds the user's email and an empty password; neither is checked.
  const updateValues: UserFormValues = { ...valid, password: "" };

  it("accepts the values without a password and trims the names", () => {
    expect(updateSchema.parse({ ...updateValues, firstName: " Ada " })).toEqual(updateValues);
  });

  it("checks the names, department, position and role like Create", () => {
    const result = updateSchema.safeParse({
      ...updateValues,
      firstName: " ",
      lastName: "y".repeat(101),
      departmentId: "",
      positionId: "",
      role: "",
    });
    expect(result.success).toBe(false);
    expect(
      Object.fromEntries(result.error?.issues.map((issue) => [issue.path[0], issue.message]) ?? []),
    ).toEqual({
      firstName: "firstNameRequired",
      lastName: "lastNameTooLong",
      departmentId: "departmentRequired",
      positionId: "positionRequired",
      role: "roleRequired",
    });
  });
});

describe("toUserFormValues", () => {
  it("fills the fields with the user's data and leaves the password empty", () => {
    expect(toUserFormValues(alpha)).toEqual({
      email: alpha.email,
      password: "",
      firstName: "Alpha",
      lastName: "Lima",
      departmentId: alpha.department?.id,
      positionId: alpha.position?.id,
      role: "ADMIN",
    });
  });

  it("leaves the fields empty that a signed-up user never filled", () => {
    expect(toUserFormValues(emailOnly)).toEqual({
      email: emailOnly.email,
      password: "",
      firstName: "",
      lastName: "",
      departmentId: "",
      positionId: "",
      role: "USER",
    });
  });
});

describe("toUpdateUserInput", () => {
  it("sends the user's id and the profile fields, but not the email or the password", () => {
    const values = schema.parse(valid);
    expect(toUpdateUserInput(alpha, values)).toEqual({
      id: alpha.id,
      firstName: "Ada",
      lastName: "Lovelace",
      departmentId: "department-1",
      positionId: "position-1",
      role: "USER",
    });
  });
});
