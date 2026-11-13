import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { DEFAULT_CV_PROJECTS_SORT } from "../cvProjects.constants";
import { toCvProjectFailure, toCvProjectsVariables } from "./cvProjects.utils";

function graphQlError(code: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({ errors: [{ message: code, extensions: { code } }] });
}

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

describe("toCvProjectFailure", () => {
  it.each([
    ["NOT_FOUND", "notFound"],
    ["FORBIDDEN", "forbidden"],
    ["CONFLICT", "conflict"],
    ["BAD_USER_INPUT", "invalid"],
  ] as const)("reads %s as %s", (code, expected) => {
    expect(toCvProjectFailure(graphQlError(code))).toBe(expected);
  });

  it("returns undefined for a code the user cannot act on", () => {
    expect(toCvProjectFailure(graphQlError("INTERNAL_SERVER_ERROR"))).toBeUndefined();
  });

  it("returns undefined for a network error", () => {
    expect(toCvProjectFailure(new Error("Failed to fetch"))).toBeUndefined();
  });

  it("prefers NOT_FOUND when the answer holds several codes", () => {
    const error = new CombinedGraphQLErrors({
      errors: [
        { message: "a", extensions: { code: "CONFLICT" } },
        { message: "b", extensions: { code: "NOT_FOUND" } },
      ],
    });

    expect(toCvProjectFailure(error)).toBe("notFound");
  });
});
