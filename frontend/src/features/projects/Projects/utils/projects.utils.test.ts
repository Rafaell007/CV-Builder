import { describe, expect, it } from "vitest";
import { toProjectsVariables } from "./projects.utils";

describe("toProjectsVariables", () => {
  it("sends the page with the page size of the table (10), not the backend default (20)", () => {
    expect(toProjectsVariables({ search: "", sort: undefined, page: 3 }).page).toEqual({
      number: 3,
      size: 10,
    });
  });

  it("leaves out the search and the sort when there are none, and never sends null", () => {
    const variables = toProjectsVariables({ search: "", sort: undefined, page: 1 });

    // The backend fails with an internal error for `sort: null`.
    expect(variables).toEqual({ page: { number: 1, size: 10 } });
    expect(Object.values(variables)).not.toContain(null);
  });

  it("leaves out a search that holds only spaces", () => {
    expect(toProjectsVariables({ search: "   ", sort: undefined, page: 1 })).not.toHaveProperty(
      "search",
    );
  });

  it("sends the search without the spaces around it", () => {
    expect(toProjectsVariables({ search: "  blog ", sort: undefined, page: 1 }).search).toBe(
      "blog",
    );
  });

  it("sends the sort as field and direction", () => {
    const variables = toProjectsVariables({
      search: "",
      sort: { field: "startDate", direction: "DESC" },
      page: 1,
    });

    expect(variables.sort).toEqual({ field: "startDate", direction: "DESC" });
  });
});
