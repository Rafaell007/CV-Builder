import type { SortState } from "@/shared/components";

/** Backend sort fields of the departments and positions queries: both sort by name only. */
export const CATALOG_SORT_FIELDS = {
  name: "name",
} as const;

/** The order of the list when the page opens, and the order the backend uses without a sort. The Name header shows it. */
export const DEFAULT_CATALOG_SORT: SortState = {
  field: CATALOG_SORT_FIELDS.name,
  direction: "ASC",
};
