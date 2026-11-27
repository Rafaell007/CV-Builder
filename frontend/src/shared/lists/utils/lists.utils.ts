import type { SortState } from "@/shared/components";
// The folder, not the shared/components barrel: Server Components call these utils (PLAN D6), and the barrel would pull
// every component into the server graph.
import { DEFAULT_PAGE_SIZE } from "@/shared/components/Pagination";
import type { ListState, ListVariables } from "../lists.types";

/** The choices a list page starts with: no search, `sort` and page 1. */
export function initialListState(sort: SortState): ListState {
  return { search: "", sort, page: 1 };
}

/**
 * The variables of the first request of a list page that starts with `sort`. The server prefetches them (PLAN D6),
 * so the first request of the page in the browser finds its answer in the Apollo cache.
 */
export function firstPageVariables(sort: SortState): ListVariables {
  return toListVariables(initialListState(sort));
}

/**
 * Turns the choices of the user into the variables of a list query.
 * The page size is always sent (10, the same as the backend default), so the page buttons never depend on the backend default.
 * The sort is always sent: a list starts sorted and a click only switches direction or column.
 * An empty search is left out. Without it the backend returns every row.
 */
export function toListVariables({ search, sort, page }: ListState): ListVariables {
  const text = search.trim();
  return {
    page: { number: page, size: DEFAULT_PAGE_SIZE },
    sort,
    ...(text === "" ? {} : { search: text }),
  };
}
