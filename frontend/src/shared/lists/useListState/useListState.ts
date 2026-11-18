"use client";

import { useState } from "react";
import type { SortState } from "@/shared/components";
import type { ListState } from "../lists.types";

export type UseListStateResult = ListState & {
  /** A new search shows the first page of the new result. The same search again (also with other spaces around it) changes nothing. */
  setSearch: (search: string) => void;
  /** A new sort shows the first page of the new order. */
  setSort: (sort: SortState) => void;
  setPage: (page: number) => void;
};

/**
 * Holds what the user chose for a list page: search, sort and page. Nothing is filtered or sorted here;
 * the backend does it. The list starts with no search, `initialSort` and page 1.
 */
export function useListState(initialSort: SortState): UseListStateResult {
  // The initializer runs only on the first render, so a new `initialSort` later does not reset the list.
  const [state, setState] = useState<ListState>(() => ({ search: "", sort: initialSort, page: 1 }));

  return {
    ...state,
    setSearch: (search) =>
      // The query sends the trimmed text, so a change of spaces only is not a new search and keeps the page.
      setState((current) =>
        current.search.trim() === search.trim() ? current : { ...current, search, page: 1 },
      ),
    setSort: (sort) => setState((current) => ({ ...current, sort, page: 1 })),
    setPage: (page) => setState((current) => ({ ...current, page })),
  };
}
