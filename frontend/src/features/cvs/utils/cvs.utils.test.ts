import { describe, expect, it } from "vitest";
import { DEFAULT_CVS_SORT } from "../cvs.constants";
import { toCvsVariables, toCvTabPath } from "./cvs.utils";

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

describe("toCvTabPath", () => {
  it("points to every tab of the CV", () => {
    expect(toCvTabPath("12", "details")).toBe("/cvs/12/details");
    expect(toCvTabPath("12", "skills")).toBe("/cvs/12/skills");
    expect(toCvTabPath("12", "projects")).toBe("/cvs/12/projects");
    expect(toCvTabPath("12", "preview")).toBe("/cvs/12/preview");
  });
});
