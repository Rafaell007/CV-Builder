import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCvsListState } from "./useCvsListState";

describe("useCvsListState", () => {
  it("starts with no search, the sort by name ascending and page 1", () => {
    const { result } = renderHook(() => useCvsListState());

    expect(result.current).toMatchObject({
      search: "",
      sort: { field: "name", direction: "ASC" },
      page: 1,
    });
  });

  it("changes the page", () => {
    const { result } = renderHook(() => useCvsListState());

    act(() => result.current.setPage(4));

    expect(result.current.page).toBe(4);
  });

  it("goes back to page 1 when the search changes, and keeps the sort", () => {
    const { result } = renderHook(() => useCvsListState());
    act(() => result.current.setSort({ field: "name", direction: "DESC" }));
    act(() => result.current.setPage(3));

    act(() => result.current.setSearch("java"));

    expect(result.current).toMatchObject({
      search: "java",
      sort: { field: "name", direction: "DESC" },
      page: 1,
    });
  });

  it("goes back to page 1 when the sort changes, and keeps the search", () => {
    const { result } = renderHook(() => useCvsListState());
    act(() => result.current.setSearch("java"));
    act(() => result.current.setPage(2));

    act(() => result.current.setSort({ field: "name", direction: "DESC" }));

    expect(result.current).toMatchObject({
      search: "java",
      sort: { field: "name", direction: "DESC" },
      page: 1,
    });
  });

  it("stays on the same page when the same search is sent again", () => {
    const { result } = renderHook(() => useCvsListState());
    act(() => result.current.setSearch("java"));
    act(() => result.current.setPage(2));

    act(() => result.current.setSearch("java"));

    expect(result.current.page).toBe(2);
  });

  it("stays on the same page when only the spaces around the search change", () => {
    const { result } = renderHook(() => useCvsListState());
    act(() => result.current.setSearch("java"));
    act(() => result.current.setPage(2));

    act(() => result.current.setSearch("java "));
    act(() => result.current.setSearch("  java"));

    expect(result.current).toMatchObject({ search: "java", page: 2 });
  });

  it("goes back to page 1 when the search is cleared", () => {
    const { result } = renderHook(() => useCvsListState());
    act(() => result.current.setSearch("java"));
    act(() => result.current.setPage(2));

    act(() => result.current.setSearch(""));

    expect(result.current).toMatchObject({ search: "", page: 1 });
  });
});
