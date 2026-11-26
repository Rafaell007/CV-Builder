import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import {
  canEditProfile,
  canVerifyEmail,
  formatMemberSince,
  getUserTabs,
  isUserNotFound,
  toUserTabPath,
} from "./userDetails.utils";

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

describe("canVerifyEmail", () => {
  it("offers it to the owner who is not verified yet", () => {
    expect(canVerifyEmail({ id: "10", isVerified: false }, "10")).toBe(true);
  });

  it("does not offer it once the email is verified", () => {
    expect(canVerifyEmail({ id: "10", isVerified: true }, "10")).toBe(false);
  });

  it("never offers it on someone else's profile, not even to an unverified Admin", () => {
    expect(canVerifyEmail({ id: "1", isVerified: false }, "10")).toBe(false);
  });

  it("does not offer it without a signed-in user", () => {
    expect(canVerifyEmail(null, "10")).toBe(false);
  });
});

describe("canEditProfile", () => {
  it("lets the owner edit their own profile", () => {
    expect(canEditProfile({ id: "10", role: "USER" }, "10")).toBe(true);
  });

  it("lets an admin edit any profile", () => {
    expect(canEditProfile({ id: "1", role: "ADMIN" }, "10")).toBe(true);
  });

  it("shows another employee's profile read-only", () => {
    expect(canEditProfile({ id: "20", role: "USER" }, "10")).toBe(false);
  });

  it("lets no one edit without a signed-in user", () => {
    expect(canEditProfile(null, "10")).toBe(false);
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
