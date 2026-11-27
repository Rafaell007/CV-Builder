import type { PageStateLabels } from "./PageState.types";

export const DEFAULT_SKELETON_ROWS = 5;

export const DEFAULT_PAGE_STATE_LABELS: PageStateLabels = {
  loading: "Loading",
  empty: "Nothing here yet",
  noResults: "No results found",
  error: "Something went wrong",
  retry: "Retry",
};
