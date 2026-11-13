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

// The longest values the project form allows (page document: name 100, domain 100, description 2000 characters).
export const MAX_NAME_LENGTH = 100;
export const MAX_DOMAIN_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 2000;
/** The backend accepts at most 50 technologies on a project (`environmentIds`). */
export const MAX_ENVIRONMENT_SKILLS = 50;

/**
 * Tablet screens are narrower than this many pixels. The Domain column is hidden below it (`DataTable`
 * `hideBelow`). CSS media queries cannot read a constant, so the two CSS files of the table repeat it
 * as `max-width: 1023px` (one pixel less). Own choice: the repo has no breakpoint token yet.
 */
export const PROJECTS_DESKTOP_MIN_WIDTH = 1024;
