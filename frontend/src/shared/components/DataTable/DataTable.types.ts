import type { ReactNode } from "react";

export type SortDirection = "ASC" | "DESC";

/** Same shape as the backend `SortInput`: `{ field, direction }`. */
export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface DataTableColumn<Row> {
  id: string;
  /** Text of the column header. */
  header: string;
  cell: (row: Row) => ReactNode;
  /** Backend sort field. A column without it is not sortable. */
  sortField?: string;
  /**
   * Hides the column (header and cells) when the window is narrower than this many pixels.
   * Example: `1024` shows the column from 1024px and hides it at 1023px and below.
   */
  hideBelow?: number;
}

/** Texts of the table. Callers pass translated texts; the defaults are English. */
export interface DataTableLabels<Row> {
  /** Screen reader text of the header above the row actions. */
  actions: string;
  selectAll: string;
  selectRow: (row: Row) => string;
}
