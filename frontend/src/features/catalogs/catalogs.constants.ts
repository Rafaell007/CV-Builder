import type { SortState } from "@/shared/components";
import { firstPageVariables } from "@/shared/lists";

/** Backend sort fields of the departments, positions and skills queries: all sort by name only. */
export const CATALOG_SORT_FIELDS = {
  name: "name",
} as const;

/** The order of the list when the page opens, and the order the backend uses without a sort. The Name header shows it. */
export const DEFAULT_CATALOG_SORT: SortState = {
  field: CATALOG_SORT_FIELDS.name,
  direction: "ASC",
};

/** The variables of the first request of every catalog page. The routes prefetch them on the server (PLAN D6). */
export const CATALOG_FIRST_PAGE = firstPageVariables(DEFAULT_CATALOG_SORT);

/** The longest department, position or skill name: the page form and the backend allow 100 characters. */
export const MAX_CATALOG_NAME_LENGTH = 100;

/** The backend accepts a search of 100 characters at most. */
export const CATALOG_SEARCH_MAX_LENGTH = 100;
