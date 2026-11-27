import { describe, expect, it } from "vitest";
import { getActiveTabIndex } from "./tabs.utils";

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
