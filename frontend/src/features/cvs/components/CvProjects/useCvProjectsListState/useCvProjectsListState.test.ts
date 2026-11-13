import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCvProjectsListState } from "./useCvProjectsListState";

describe("useCvProjectsListState", () => {
  it("starts with no search and the sort by name ascending", () => {
    const { result } = renderHook(() => useCvProjectsListState());

    expect(result.current).toMatchObject({ search: "", sort: { field: "name", direction: "ASC" } });
  });

  it("keeps the sort when the search changes, and the search when the sort changes", () => {
    const { result } = renderHook(() => useCvProjectsListState());

    act(() => result.current.setSort({ field: "endDate", direction: "DESC" }));
    act(() => result.current.setSearch("bank"));

    expect(result.current).toMatchObject({
      search: "bank",
      sort: { field: "endDate", direction: "DESC" },
    });
  });

  it("treats the same search with other spaces as no change", () => {
    const { result } = renderHook(() => useCvProjectsListState());
    act(() => result.current.setSearch("bank"));
    const before = result.current;

    act(() => result.current.setSearch(" bank "));

    expect(result.current.search).toBe(before.search);
  });
});
