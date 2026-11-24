import { describe, expect, it } from "vitest";
import { DEFAULT_CV_PROJECTS_SORT } from "../cvProjects.constants";
import { toCvProjectsVariables, toResponsibilityTags } from "./cvProjects.utils";

describe("toCvProjectsVariables", () => {
  it("always sends the CV and the sort, and leaves an empty search out", () => {
    expect(toCvProjectsVariables("cv-1", { search: "", sort: DEFAULT_CV_PROJECTS_SORT })).toEqual({
      cvId: "cv-1",
      sort: { field: "name", direction: "ASC" },
    });
  });

  it("leaves a search of spaces out", () => {
    expect(
      toCvProjectsVariables("cv-1", { search: "   ", sort: DEFAULT_CV_PROJECTS_SORT }),
    ).not.toHaveProperty("search");
  });

  it("sends the trimmed search and the chosen sort", () => {
    expect(
      toCvProjectsVariables("cv-1", {
        search: "  bank ",
        sort: { field: "endDate", direction: "DESC" },
      }),
    ).toEqual({ cvId: "cv-1", search: "bank", sort: { field: "endDate", direction: "DESC" } });
  });
});

describe("toResponsibilityTags", () => {
  it("makes one tag per line and trims it", () => {
    expect(toResponsibilityTags("Did something great\r\n  Did not break production  ")).toEqual([
      "Did something great",
      "Did not break production",
    ]);
  });

  it("leaves blank lines out and gives no tag for no text", () => {
    expect(toResponsibilityTags("One\n\n   \nTwo")).toEqual(["One", "Two"]);
    expect(toResponsibilityTags("")).toEqual([]);
    expect(toResponsibilityTags(null)).toEqual([]);
    expect(toResponsibilityTags(undefined)).toEqual([]);
  });
});
