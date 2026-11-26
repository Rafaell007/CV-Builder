import { describe, expect, it } from "vitest";
import { z } from "zod";
import { USER_NAME_MAX_LENGTH } from "../userProfile.constants";
import { userProfileRules, type UserProfileRuleMessages } from "./userProfileRules.utils";

// Each message is its own key, so a test sees which rule failed.
const messages: UserProfileRuleMessages = {
  firstNameRequired: "firstNameRequired",
  firstNameTooLong: "firstNameTooLong",
  lastNameRequired: "lastNameRequired",
  lastNameTooLong: "lastNameTooLong",
  departmentRequired: "departmentRequired",
  positionRequired: "positionRequired",
};
const schema = z.object(userProfileRules(messages));

const valid = { firstName: "Ada", lastName: "Lovelace", departmentId: "d1", positionId: "p1" };

// The message of each failed field, as `{ field: message }`.
function errorsOf(values: Partial<typeof valid>) {
  const result = schema.safeParse({ ...valid, ...values });
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("userProfileRules", () => {
  it("accepts a filled profile and trims the names", () => {
    expect(schema.parse({ ...valid, firstName: " Ada ", lastName: " Lovelace " })).toEqual(valid);
  });

  it("asks for every field; a name of spaces counts as empty", () => {
    expect(errorsOf({ firstName: "   ", lastName: "", departmentId: "", positionId: "" })).toEqual({
      firstName: "firstNameRequired",
      lastName: "lastNameRequired",
      departmentId: "departmentRequired",
      positionId: "positionRequired",
    });
  });

  it("accepts names of the maximum length and refuses longer ones", () => {
    const longest = "n".repeat(USER_NAME_MAX_LENGTH);

    expect(errorsOf({ firstName: longest, lastName: longest })).toEqual({});
    expect(errorsOf({ firstName: `${longest}n`, lastName: `${longest}n` })).toEqual({
      firstName: "firstNameTooLong",
      lastName: "lastNameTooLong",
    });
  });
});
