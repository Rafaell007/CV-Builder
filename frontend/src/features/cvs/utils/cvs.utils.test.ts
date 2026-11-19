import { describe, expect, it } from "vitest";
import { DEFAULT_CVS_SORT } from "../cvs.constants";
import { toCvsVariables, toCvTabPath } from "./cvs.utils";

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

describe("toCvTabPath", () => {
  it("points to every tab of the CV", () => {
    expect(toCvTabPath("12", "details")).toBe("/cvs/12/details");
    expect(toCvTabPath("12", "skills")).toBe("/cvs/12/skills");
    expect(toCvTabPath("12", "projects")).toBe("/cvs/12/projects");
    expect(toCvTabPath("12", "preview")).toBe("/cvs/12/preview");
  });
});
