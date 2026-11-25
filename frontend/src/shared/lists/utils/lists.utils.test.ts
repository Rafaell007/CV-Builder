import { describe, expect, it } from "vitest";
import type { ListState } from "../lists.types";
import { firstPageVariables, toListVariables } from "./lists.utils";

const nameAscending = { field: "name", direction: "ASC" } as const;
const state = (changes: Partial<ListState> = {}): ListState => ({
  search: "",
  sort: nameAscending,
  page: 1,
  ...changes,
});

describe("toListVariables", () => {
  it("always sends the page size 10, the same as the backend default", () => {
    expect(toListVariables(state({ page: 3 })).page).toEqual({ number: 3, size: 10 });
  });

  it("sends the sort of the state, also the one the page starts with", () => {
    expect(toListVariables(state())).toEqual({
      page: { number: 1, size: 10 },
      sort: nameAscending,
    });
  });

  it("leaves out a search that holds only spaces", () => {
    expect(toListVariables(state({ search: "   " }))).not.toHaveProperty("search");
  });

  it("sends the search without the spaces around it", () => {
    expect(toListVariables(state({ search: "  blog " })).search).toBe("blog");
  });

  it("sends the sort as field and direction", () => {
    const sort = { field: "startDate", direction: "DESC" } as const;

    expect(toListVariables(state({ sort })).sort).toEqual(sort);
  });
});

describe("firstPageVariables", () => {
  it("asks for page 1 of 10 rows in the given order, with no search", () => {
    expect(firstPageVariables(nameAscending)).toEqual({
      page: { number: 1, size: 10 },
      sort: nameAscending,
    });
  });
});
