import { describe, expect, it } from "vitest";
import { getActiveTabIndex, isTabActive } from "./tabs.utils";

describe("isTabActive", () => {
  it("matches the same route and the routes below it", () => {
    expect(isTabActive("/users/1", "/users/1")).toBe(true);
    expect(isTabActive("/users/1", "/users/1/skills")).toBe(true);
  });

  it("does not match a route that only shares the start of the text", () => {
    expect(isTabActive("/users/1", "/users/10")).toBe(false);
  });
});

describe("getActiveTabIndex", () => {
  const hrefs = ["/users/1", "/users/1/skills", "/users/1/languages"];

  it("returns the tab of the current route", () => {
    expect(getActiveTabIndex(hrefs, "/users/1/languages")).toBe(2);
  });

  it("prefers the longest matching href", () => {
    expect(getActiveTabIndex(hrefs, "/users/1/skills")).toBe(1);
  });

  it("returns -1 when no tab matches", () => {
    expect(getActiveTabIndex(hrefs, "/cvs")).toBe(-1);
  });
});
