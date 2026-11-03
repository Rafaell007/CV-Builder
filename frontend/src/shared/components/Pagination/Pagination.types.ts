/** One slot of the page list: a page number or a gap shown as "…". */
export type PageItem = number | "ellipsis";

/** Texts of the control. Callers pass translated texts; the defaults are English. */
export interface PaginationLabels {
  navigation: string;
  previous: string;
  next: string;
  page: (number: number) => string;
}
