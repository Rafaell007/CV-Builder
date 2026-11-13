import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toCvSkillFailure } from "./toCvSkillFailure";

function graphQlError(code: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({ errors: [{ message: code, extensions: { code } }] });
}

describe("toCvSkillFailure", () => {
  it.each([
    ["NOT_FOUND", "notFound"],
    ["FORBIDDEN", "forbidden"],
    ["CONFLICT", "conflict"],
    ["BAD_USER_INPUT", "invalid"],
  ] as const)("reads %s as %s", (code, expected) => {
    expect(toCvSkillFailure(graphQlError(code))).toBe(expected);
  });

  it("returns undefined for a code the user cannot act on", () => {
    expect(toCvSkillFailure(graphQlError("INTERNAL_SERVER_ERROR"))).toBeUndefined();
  });

  it("returns undefined for a network error", () => {
    expect(toCvSkillFailure(new Error("Failed to fetch"))).toBeUndefined();
  });

  it("prefers NOT_FOUND when the answer holds several codes", () => {
    const error = new CombinedGraphQLErrors({
      errors: [
        { message: "a", extensions: { code: "CONFLICT" } },
        { message: "b", extensions: { code: "NOT_FOUND" } },
      ],
    });

    expect(toCvSkillFailure(error)).toBe("notFound");
  });
});
