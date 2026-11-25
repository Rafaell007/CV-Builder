import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { getUserTabs, toUserLayoutView, toUserTabPath } from "./userDetails.utils";

const graphQLError = (code: string) =>
  new CombinedGraphQLErrors({ errors: [{ message: code, extensions: { code } }] });

describe("toUserTabPath", () => {
  it("gives the route of a tab of the user", () => {
    expect(toUserTabPath("10", "cvs")).toBe("/users/10/cvs");
  });
});

describe("getUserTabs", () => {
  it("gives the four tabs to an admin", () => {
    expect(getUserTabs(true)).toEqual(["profile", "skills", "languages", "cvs"]);
  });

  it("leaves out the CVs tab for anyone else", () => {
    expect(getUserTabs(false)).toEqual(["profile", "skills", "languages"]);
  });
});

describe("toUserLayoutView", () => {
  it("shows the page when the user is there, even after a failed refresh", () => {
    expect(toUserLayoutView(true, undefined)).toBe("ready");
    expect(toUserLayoutView(true, new Error("Failed to fetch"))).toBe("ready");
  });

  it("shows not found for an unknown id and for an id that is not a UUID", () => {
    expect(toUserLayoutView(false, graphQLError("NOT_FOUND"))).toBe("notFound");
    expect(toUserLayoutView(false, graphQLError("BAD_USER_INPUT"))).toBe("notFound");
  });

  it("shows a failure that can be retried for any other error", () => {
    expect(toUserLayoutView(false, new Error("Failed to fetch"))).toBe("failed");
    expect(toUserLayoutView(false, graphQLError("INTERNAL_SERVER_ERROR"))).toBe("failed");
  });
});
