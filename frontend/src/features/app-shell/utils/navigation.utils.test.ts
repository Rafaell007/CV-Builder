import { describe, expect, it } from "vitest";
import { getNavItems, toSidebarLinks } from "./navigation.utils";

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

describe("toSidebarLinks", () => {
  const { mainItems } = getNavItems("USER");
  const translate = (key: string) => `label:${key}`;

  it("translates every label", () => {
    const links = toSidebarLinks(mainItems, "/cvs", translate);

    expect(links.map((link) => link.label)).toEqual([
      "label:employees",
      "label:skills",
      "label:languages",
      "label:cvs",
    ]);
  });

  it("marks the link of the current page and of the pages below it", () => {
    const links = toSidebarLinks(mainItems, "/users/5/profile", translate);

    expect(links.filter((link) => link.active).map((link) => link.href)).toEqual(["/users"]);
  });

  it("marks no link on a page outside the navigation", () => {
    const links = toSidebarLinks(mainItems, "/settings", translate);

    expect(links.some((link) => link.active)).toBe(false);
  });
});
