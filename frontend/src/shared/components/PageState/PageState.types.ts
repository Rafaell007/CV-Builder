/** What the page shows instead of its content. */
export type PageStateKind = "loading" | "empty" | "no-results" | "error";

/** Texts of the states. Callers pass translated texts; the defaults are English. */
export interface PageStateLabels {
  loading: string;
  empty: string;
  noResults: string;
  error: string;
  retry: string;
}
