import { describe, expect, it } from "vitest";
import { getNavItems } from "./navigation.utils";

describe("getNavItems", () => {
  it("gives a user the 4 main links and no extra links", () => {
    const { mainItems, extraItems } = getNavItems("USER");

    expect(mainItems.map((item) => item.href)).toEqual(["/users", "/skills", "/languages", "/cvs"]);
    expect(extraItems).toEqual([]);
  });

  it("sends an admin to the management pages for skills and languages", () => {
    const { mainItems } = getNavItems("ADMIN");

    expect(mainItems.map((item) => item.href)).toEqual([
      "/users",
      "/admin/skills",
      "/admin/languages",
      "/cvs",
    ]);
  });

  it("gives an admin the 3 extra links below the divider", () => {
    const { extraItems } = getNavItems("ADMIN");

    expect(extraItems.map((item) => item.href)).toEqual([
      "/admin/departments",
      "/admin/positions",
      "/admin/projects",
    ]);
  });
});
