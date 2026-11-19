import { describe, expect, it } from "vitest";
import { DEFAULT_CVS_SORT } from "../cvs.constants";
import { toCvReturnPath, toCvsVariables, toCvTabPath, toUserCvsPath } from "./cvs.utils";

const state = { search: "", sort: DEFAULT_CVS_SORT, page: 1 };

describe("toCvsVariables", () => {
  it("always sends the page number, a page size of 10 and the sort", () => {
    expect(toCvsVariables({ ...state, page: 3 })).toEqual({
      page: { number: 3, size: 10 },
      sort: { field: "name", direction: "ASC" },
    });
  });

  it("leaves out an empty search and a search of spaces", () => {
    expect(toCvsVariables({ ...state, search: "" })).not.toHaveProperty("search");
    expect(toCvsVariables({ ...state, search: "   " })).not.toHaveProperty("search");
  });

  it("trims the search", () => {
    expect(toCvsVariables({ ...state, search: "  anna@  " }).search).toBe("anna@");
  });

  it("sends the sort of the state", () => {
    const sort = { field: "name", direction: "DESC" } as const;

    expect(toCvsVariables({ ...state, sort }).sort).toEqual(sort);
  });

  it("leaves out the user id when it is not given", () => {
    expect(toCvsVariables(state)).not.toHaveProperty("userId");
  });

  it("sends the user id when it is given", () => {
    expect(toCvsVariables(state, "7").userId).toBe("7");
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
  ])("drops %s", (_name, value) => {
    expect(toCvReturnPath(value)).toBeUndefined();
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
