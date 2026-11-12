import type { SortState } from "@/shared/components";

/** Backend sort fields of the projects query. They are the `sortField` of the sortable columns. */
export const PROJECT_SORT_FIELDS = {
  name: "name",
  startDate: "startDate",
  endDate: "endDate",
} as const;

/** The backend accepts a search of 100 characters at most. */
export const SEARCH_MAX_LENGTH = 100;

/** The order of the list when the page opens, and the order the backend uses without a sort. The Name header shows it. */
export const DEFAULT_PROJECTS_SORT: SortState = {
  field: PROJECT_SORT_FIELDS.name,
  direction: "ASC",
};
