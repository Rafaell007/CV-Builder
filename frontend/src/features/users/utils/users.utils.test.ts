import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toDeleteUserFailure, toUserProfilePath } from "./users.utils";

describe("toUserProfilePath", () => {
  it("is the profile page of the user", () => {
    expect(toUserProfilePath("u1")).toBe("/users/u1/profile");
  });
});

describe("toDeleteUserFailure", () => {
  const graphQlError = (extensions: Record<string, unknown>) =>
    new CombinedGraphQLErrors({ errors: [{ message: "Refused", extensions }] });

  it("returns self for the CONFLICT of an admin deleting their own account", () => {
    expect(toDeleteUserFailure(graphQlError({ code: "CONFLICT", reason: "SELF_DELETE" }))).toBe(
      "self",
    );
  });

  it("returns concurrentChange for the CONFLICT of a change at the same time", () => {
    expect(
      toDeleteUserFailure(graphQlError({ code: "CONFLICT", reason: "CONCURRENT_CHANGE" })),
    ).toBe("concurrentChange");
  });

  it("returns notFound and forbidden for those codes", () => {
    expect(toDeleteUserFailure(graphQlError({ code: "NOT_FOUND" }))).toBe("notFound");
    expect(toDeleteUserFailure(graphQlError({ code: "FORBIDDEN" }))).toBe("forbidden");
  });

  it("returns nothing for another CONFLICT, another code or a network error", () => {
    expect(toDeleteUserFailure(graphQlError({ code: "CONFLICT" }))).toBeUndefined();
    expect(toDeleteUserFailure(graphQlError({ code: "INTERNAL_SERVER_ERROR" }))).toBeUndefined();
    expect(toDeleteUserFailure(new Error("Failed to fetch"))).toBeUndefined();
  });
});
