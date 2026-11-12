/** Backend sort fields of the projects query. They are the `sortField` of the sortable columns. */
export const PROJECT_SORT_FIELDS = {
  name: "name",
  startDate: "startDate",
  endDate: "endDate",
} as const;

/** The backend accepts a search of 100 characters at most. */
export const SEARCH_MAX_LENGTH = 100;
