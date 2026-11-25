import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { formatMemberSince, getUserTabs, isUserNotFound, toUserTabPath } from "./userDetails.utils";

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

describe("isUserNotFound", () => {
  it("is true for an unknown id and for an id that is not a UUID", () => {
    expect(isUserNotFound(graphQLError("NOT_FOUND"))).toBe(true);
    expect(isUserNotFound(graphQLError("BAD_USER_INPUT"))).toBe(true);
  });

  it("is false for any other failure, which can be retried", () => {
    expect(isUserNotFound(new Error("Failed to fetch"))).toBe(false);
    expect(isUserNotFound(graphQLError("INTERNAL_SERVER_ERROR"))).toBe(false);
    expect(isUserNotFound(undefined)).toBe(false);
  });
});

describe("formatMemberSince", () => {
  it("formats the day with the rules of the language", () => {
    expect(formatMemberSince("2024-01-14T10:00:00.000Z", "en")).toBe("Sun, Jan 14, 2024");
    expect(formatMemberSince("2024-01-14T10:00:00.000Z", "pl")).toBe("niedz., 14 sty 2024");
  });

  it("reads the day in UTC, so a time near midnight does not move it", () => {
    expect(formatMemberSince("2024-01-14T23:30:00.000Z", "en")).toBe("Sun, Jan 14, 2024");
    expect(formatMemberSince("2024-01-14T00:30:00.000Z", "en")).toBe("Sun, Jan 14, 2024");
  });

  it("returns null for a value that is not a date", () => {
    expect(formatMemberSince("not a date", "en")).toBeNull();
  });
});
