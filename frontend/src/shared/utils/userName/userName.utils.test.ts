import { describe, expect, it } from "vitest";
import { getUserDisplayName } from "./userName.utils";

const email = "user@example.com";

describe("getUserDisplayName", () => {
  it("joins the first and the last name", () => {
    expect(getUserDisplayName({ email, firstName: "Alpha", lastName: "Lima" })).toBe("Alpha Lima");
  });

  it("uses the one name that is filled", () => {
    expect(getUserDisplayName({ email, firstName: "Charlie", lastName: null })).toBe("Charlie");
    expect(getUserDisplayName({ email, firstName: null, lastName: "Lima" })).toBe("Lima");
  });

  it("falls back to the email when no name is filled, also for blank or missing names", () => {
    expect(getUserDisplayName({ email, firstName: null, lastName: null })).toBe(email);
    expect(getUserDisplayName({ email, firstName: " ", lastName: "" })).toBe(email);
    expect(getUserDisplayName({ email })).toBe(email);
  });
});
