import { describe, expect, it } from "vitest";
import type { ProjectsListState } from "../projects.types";
import { toProjectsVariables } from "./projects.utils";

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
