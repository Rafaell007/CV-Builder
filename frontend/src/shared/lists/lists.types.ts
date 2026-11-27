import type { SortState } from "@/shared/components";

/** What the user chose for a list page: the search text, the sort and the page (starts at 1). */
export interface ListState {
  search: string;
  sort: SortState;
  page: number;
}

/** The variables every list query sends: the page (number and size), the sort and, when not empty, the search. */
export interface ListVariables {
  page: { number: number; size: number };
  sort: SortState;
  search?: string;
}

/** The part of a list query result that a list page needs: the rows of one page and the number of rows on all pages. */
export interface PagedResult<TItem> {
  items: readonly TItem[];
  total: number;
}
