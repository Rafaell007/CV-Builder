import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import type { ProjectsListState } from "../projects.types";
import { toDeleteProjectFailure, toProjectsVariables } from "./projects.utils";

const nameAscending = { field: "name", direction: "ASC" } as const;
const state = (changes: Partial<ProjectsListState> = {}): ProjectsListState => ({
  search: "",
  sort: nameAscending,
  page: 1,
  ...changes,
});

describe("toProjectsVariables", () => {
  it("always sends the page size 10, the same as the backend default", () => {
    expect(toProjectsVariables(state({ page: 3 })).page).toEqual({ number: 3, size: 10 });
  });

  it("sends the sort of the state, also the one the page starts with", () => {
    expect(toProjectsVariables(state())).toEqual({
      page: { number: 1, size: 10 },
      sort: nameAscending,
    });
  });

  it("leaves out a search that holds only spaces", () => {
    expect(toProjectsVariables(state({ search: "   " }))).not.toHaveProperty("search");
  });

  it("sends the search without the spaces around it", () => {
    expect(toProjectsVariables(state({ search: "  blog " })).search).toBe("blog");
  });

  it("sends the sort as field and direction", () => {
    const sort = { field: "startDate", direction: "DESC" } as const;

    expect(toProjectsVariables(state({ sort })).sort).toEqual(sort);
  });
});

describe("toDeleteProjectFailure", () => {
  const graphQlError = (code: string, message: string) =>
    new CombinedGraphQLErrors({ errors: [{ message, extensions: { code } }] });

  it("returns the message of a CONFLICT error, so the user reads the business rule", () => {
    const error = graphQlError("CONFLICT", "The project is used in 2 CVs");

    expect(toDeleteProjectFailure(error)).toBe("The project is used in 2 CVs");
  });

  it("returns nothing for another GraphQL error, so the caller shows a friendly text", () => {
    expect(toDeleteProjectFailure(graphQlError("INTERNAL_SERVER_ERROR", "Boom"))).toBeUndefined();
  });

  it("returns nothing for a network error", () => {
    expect(toDeleteProjectFailure(new Error("Failed to fetch"))).toBeUndefined();
  });
});
