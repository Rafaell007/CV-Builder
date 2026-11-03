import type { PaginationLabels } from "./Pagination.types";

/** Table page size (PLAN D19). The backend default is 20, so list queries must send this value. */
export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_PAGINATION_LABELS: PaginationLabels = {
  navigation: "Pagination",
  previous: "Previous page",
  next: "Next page",
  page: (number) => `Page ${number}`,
};
