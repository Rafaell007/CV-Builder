import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SortState } from "@/shared/components";
import { useListState } from "./useListState";

const NAME_ASC: SortState = { field: "name", direction: "ASC" };

describe("useListState", () => {
  it("starts with no search, the given sort and page 1", () => {
    const { result } = renderHook(() => useListState(NAME_ASC));

    expect(result.current).toMatchObject({ search: "", sort: NAME_ASC, page: 1 });
  });

  it("keeps its sort when the initial sort changes on a later render", () => {
    const { result, rerender } = renderHook(({ sort }) => useListState(sort), {
      initialProps: { sort: NAME_ASC },
    });

    rerender({ sort: { field: "startDate", direction: "DESC" } });

    expect(result.current.sort).toEqual(NAME_ASC);
  });

  it("changes the page", () => {
    const { result } = renderHook(() => useListState(NAME_ASC));

    act(() => result.current.setPage(4));

    expect(result.current.page).toBe(4);
  });

  it("goes back to page 1 when the search changes, and keeps the sort", () => {
    const { result } = renderHook(() => useListState(NAME_ASC));
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
    const { result } = renderHook(() => useListState(NAME_ASC));
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
    const { result } = renderHook(() => useListState(NAME_ASC));
    act(() => result.current.setSearch("bank"));
    act(() => result.current.setPage(2));

    act(() => result.current.setSearch("bank"));

    expect(result.current.page).toBe(2);
  });

  it("stays on the same page when only the spaces around the search change", () => {
    const { result } = renderHook(() => useListState(NAME_ASC));
    act(() => result.current.setSearch("bank"));
    act(() => result.current.setPage(2));

    act(() => result.current.setSearch("bank "));
    act(() => result.current.setSearch("  bank"));

    expect(result.current).toMatchObject({ search: "bank", page: 2 });
  });

  it("goes back to page 1 when the search is cleared", () => {
    const { result } = renderHook(() => useListState(NAME_ASC));
    act(() => result.current.setSearch("bank"));
    act(() => result.current.setPage(2));

    act(() => result.current.setSearch(""));

    expect(result.current).toMatchObject({ search: "", page: 1 });
  });
});
