import type { SortState } from "@/shared/components";
import { firstPageVariables } from "@/shared/lists";

/** Backend sort fields of the CVs query. The backend accepts only `name` (`resolveSort`). */
export const CV_SORT_FIELDS = {
  name: "name",
} as const;

/** The backend accepts a search of 100 characters at most. */
export const SEARCH_MAX_LENGTH = 100;

/** The order of the list when the page opens, and the order the backend uses without a sort. The Name header shows it. */
export const DEFAULT_CVS_SORT: SortState = {
  field: CV_SORT_FIELDS.name,
  direction: "ASC",
};

/** The variables of the first `Cvs` request of the `/cvs` page. The route prefetches them on the server (PLAN D6). */
export const CVS_FIRST_PAGE = firstPageVariables(DEFAULT_CVS_SORT);

// The longest values the CV form allows (page document: name 255, education 255; backend: description 2000).
export const MAX_NAME_LENGTH = 255;
export const MAX_EDUCATION_LENGTH = 255;
export const MAX_DESCRIPTION_LENGTH = 2000;

/** The tabs of a CV, in the order the CV Details page shows them. Each one is a route: `/cvs/{id}/{tab}`. */
export const CV_TABS = ["details", "skills", "projects", "preview"] as const;
