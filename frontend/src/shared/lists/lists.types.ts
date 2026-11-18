import type { SortState } from "@/shared/components";

/** What the user chose for a list page: the search text, the sort and the page (starts at 1). */
export interface ListState {
  search: string;
  sort: SortState;
  page: number;
}
