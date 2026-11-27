import type { SortState } from "@/shared/components";

/** Backend sort fields of the `cvProjects` query. They are the `sortField` of the sortable columns. */
export const CV_PROJECT_SORT_FIELDS = {
  name: "name",
  startDate: "startDate",
  endDate: "endDate",
} as const;

/** The order of the list when the page opens, and the order the backend uses without a sort. The Name header shows it. */
export const DEFAULT_CV_PROJECTS_SORT: SortState = {
  field: CV_PROJECT_SORT_FIELDS.name,
  direction: "ASC",
};

/** The longest search text the page sends. The same limit as the project search of the admin page. */
export const SEARCH_MAX_LENGTH = 100;

/** The backend allows at most 2000 characters of responsibilities (`MAX_RESPONSIBILITIES_LENGTH`, a team choice). */
export const MAX_RESPONSIBILITIES_LENGTH = 2000;

/** The backend accepts 1 to 50 roles on one CV project (`roleIds`). */
export const MAX_ROLES = 50;
