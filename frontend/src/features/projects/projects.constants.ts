import type { SortState } from "@/shared/components";
import { firstPageVariables } from "@/shared/lists";

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

/** The variables of the first `Projects` request of the page. The route prefetches them on the server (PLAN D6). */
export const PROJECTS_FIRST_PAGE = firstPageVariables(DEFAULT_PROJECTS_SORT);

// The longest values the project form allows (page document: name 100, domain 100, description 2000 characters).
export const MAX_NAME_LENGTH = 100;
export const MAX_DOMAIN_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 2000;
/** The backend accepts at most 50 technologies on a project (`environmentIds`). */
export const MAX_ENVIRONMENT_SKILLS = 50;
