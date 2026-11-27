import { describe, expect, it } from "vitest";
import { toUserProfilePath } from "./users.utils";

describe("toUserProfilePath", () => {
  it("is the profile page of the user", () => {
    expect(toUserProfilePath("u1")).toBe("/users/u1/profile");
  });
});
