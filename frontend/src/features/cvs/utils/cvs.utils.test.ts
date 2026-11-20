import { describe, expect, it } from "vitest";
import { DEFAULT_CVS_SORT } from "../cvs.constants";
import {
  toActiveTabHref,
  toCvOpenPath,
  toCvReturnPath,
  toCvsVariables,
  toCvTabLinks,
  toCvTabPath,
  toUserCvsPath,
  withScope,
} from "./cvs.utils";

const state = { search: "", sort: DEFAULT_CVS_SORT, page: 1 };

// The page, sort and search rules are tested with the shared toListVariables (@/shared/lists).
describe("toCvsVariables", () => {
  it("sends the shared list variables and leaves out the user id when it is not given", () => {
    expect(toCvsVariables({ ...state, search: "  anna@  ", page: 3 })).toEqual({
      page: { number: 3, size: 10 },
      sort: { field: "name", direction: "ASC" },
      search: "anna@",
    });
  });

  it("sends the user id when it is given", () => {
    expect(toCvsVariables(state, "7")).toEqual({
      page: { number: 1, size: 10 },
      sort: { field: "name", direction: "ASC" },
      userId: "7",
    });
  });
});

describe("toCvTabPath with a return page", () => {
  it("adds the page to return to as an encoded query", () => {
    expect(toCvTabPath("12", "preview", "/users/10/cvs")).toBe(
      "/cvs/12/preview?from=%2Fusers%2F10%2Fcvs",
    );
  });
});

describe("toUserCvsPath", () => {
  it("gives the User CVs tab of the employee", () => {
    expect(toUserCvsPath("10")).toBe("/users/10/cvs");
  });
});

describe("toCvReturnPath", () => {
  it("keeps the path of a User CVs tab", () => {
    expect(toCvReturnPath("/users/10/cvs")).toBe("/users/10/cvs");
    expect(toCvReturnPath("/users/3f2a-9c_1/cvs")).toBe("/users/3f2a-9c_1/cvs");
  });

  it("keeps the path of a User CVs tab when the user id has upper-case letters", () => {
    expect(toCvReturnPath("/users/AbC123/cvs")).toBe("/users/AbC123/cvs");
  });

  it.each([
    ["nothing", null],
    ["an empty value", ""],
    ["another site", "https://evil.example/users/10/cvs"],
    ["a protocol-relative address", "//evil.example/users/10/cvs"],
    ["another page of the app", "/cvs"],
    ["another tab of the employee", "/users/10/skills"],
    ["a path with extra parts", "/users/10/cvs/extra"],
    ["a path with a query", "/users/10/cvs?x=1"],
    ["a path with a parent step", "/users/../admin/cvs"],
    ["a path with a new line", "/users/10/cvs\n"],
    ["a path without a user id", "/users//cvs"],
  ])("drops %s", (_name, value) => {
    expect(toCvReturnPath(value)).toBeUndefined();
  });

  it("drops a value that is not a string, even when it turns into a valid path as text", () => {
    const notText = { toString: () => "/users/10/cvs" } as unknown as string;

    expect(toCvReturnPath(notText)).toBeUndefined();
    expect(toCvReturnPath(undefined)).toBeUndefined();
  });
});

describe("toCvTabPath", () => {
  it("points to every tab of the CV", () => {
    expect(toCvTabPath("12", "details")).toBe("/cvs/12/details");
    expect(toCvTabPath("12", "skills")).toBe("/cvs/12/skills");
    expect(toCvTabPath("12", "projects")).toBe("/cvs/12/projects");
    expect(toCvTabPath("12", "preview")).toBe("/cvs/12/preview");
  });
});

describe("withScope", () => {
  it("returns the employee when it is given", () => {
    expect(withScope("10")).toEqual({ userId: "10" });
  });

  it("returns an object without the key when there is no employee", () => {
    expect(withScope()).toEqual({});
    expect("userId" in withScope(undefined)).toBe(false);
  });
});

describe("toCvOpenPath", () => {
  it("opens the Preview tab", () => {
    expect(toCvOpenPath("12")).toBe("/cvs/12/preview");
  });

  it("remembers the User CVs tab of the employee", () => {
    expect(toCvOpenPath("12", "10")).toBe(
      `/cvs/12/preview?from=${encodeURIComponent("/users/10/cvs")}`,
    );
  });
});

describe("toCvTabLinks", () => {
  it("gives every tab a path without a query and a link that keeps from", () => {
    const links = toCvTabLinks("12", "/users/10/cvs");

    expect(links.map((link) => link.tab)).toEqual(["details", "skills", "projects", "preview"]);
    expect(links[1]).toEqual({
      tab: "skills",
      path: "/cvs/12/skills",
      href: `/cvs/12/skills?from=${encodeURIComponent("/users/10/cvs")}`,
    });
  });

  it("gives the same path and link when there is no from", () => {
    expect(toCvTabLinks("12").every((link) => link.path === link.href)).toBe(true);
  });
});

describe("toActiveTabHref", () => {
  it("keeps the pathname when there is no from", () => {
    expect(toActiveTabHref("/cvs/12/skills")).toBe("/cvs/12/skills");
  });

  it("adds the same query as the tab links, so Tabs can match them", () => {
    expect(toActiveTabHref("/cvs/12/skills", "/users/10/cvs")).toBe(
      toCvTabLinks("12", "/users/10/cvs")[1]!.href,
    );
  });
});
