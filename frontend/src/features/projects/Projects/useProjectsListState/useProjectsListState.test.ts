import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useProjectsListState } from "./useProjectsListState";

describe("useProjectsListState", () => {
  it("starts with no search, no sort and page 1", () => {
    const { result } = renderHook(() => useProjectsListState());

    expect(result.current).toMatchObject({ search: "", sort: undefined, page: 1 });
  });

  it("changes the page", () => {
    const { result } = renderHook(() => useProjectsListState());

    act(() => result.current.setPage(4));

    expect(result.current.page).toBe(4);
  });

  it("goes back to page 1 when the search changes, and keeps the sort", () => {
    const { result } = renderHook(() => useProjectsListState());
    act(() => result.current.setSort({ field: "name", direction: "DESC" }));
    act(() => result.current.setPage(3));

    act(() => result.current.setSearch("bank"));

    expect(result.current).toMatchObject({
      search: "bank",
      sort: { field: "name", direction: "DESC" },
      page: 1,
    });
  });

  it("goes back to page 1 when the sort changes, and keeps the search", () => {
    const { result } = renderHook(() => useProjectsListState());
    act(() => result.current.setSearch("bank"));
    act(() => result.current.setPage(2));

    act(() => result.current.setSort({ field: "startDate", direction: "ASC" }));

    expect(result.current).toMatchObject({
      search: "bank",
      sort: { field: "startDate", direction: "ASC" },
      page: 1,
    });
  });

  it("stays on the same page when the same search is sent again", () => {
    const { result } = renderHook(() => useProjectsListState());
    act(() => result.current.setSearch("bank"));
    act(() => result.current.setPage(2));

    act(() => result.current.setSearch("bank"));

    expect(result.current.page).toBe(2);
  });

  it("removes the sort when the sort is cleared", () => {
    const { result } = renderHook(() => useProjectsListState());
    act(() => result.current.setSort({ field: "name", direction: "ASC" }));

    act(() => result.current.setSort(undefined));

    expect(result.current.sort).toBeUndefined();
  });
});
