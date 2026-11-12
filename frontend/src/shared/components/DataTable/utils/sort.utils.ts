import type { SortState } from "../DataTable.types";

/** Click order of a sortable header: ASC → DESC → ASC. A new field starts at ASC. There is no "no sort" state. */
export function getNextSort(current: SortState | undefined, field: string): SortState {
  if (current?.field === field && current.direction === "ASC") return { field, direction: "DESC" };
  return { field, direction: "ASC" };
}

export type AriaSort = "ascending" | "descending" | "none";

export function getAriaSort(current: SortState | undefined, field: string): AriaSort {
  if (current?.field !== field) return "none";
  return current.direction === "ASC" ? "ascending" : "descending";
}
