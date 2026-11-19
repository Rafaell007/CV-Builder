import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import type { ListState, ListVariables } from "../lists.types";

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
