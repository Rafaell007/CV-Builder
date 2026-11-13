import type { PaginationLabels } from "./Pagination.types";

/** Table page size (PLAN D19). The backend default is 10 too (`DEFAULT_PAGE_SIZE` in `backend/src/common/pagination`). List queries still send this value, so the page buttons never depend on the backend default. */
export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_PAGINATION_LABELS: PaginationLabels = {
  navigation: "Pagination",
  previous: "Previous page",
  next: "Next page",
  page: (number) => `Page ${number}`,
};
