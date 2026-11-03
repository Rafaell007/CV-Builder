import type { SortState } from "../DataTable.types";

/** Click order of a sortable header: no sort → ASC → DESC → no sort. A new field starts at ASC. */
export function getNextSort(current: SortState | undefined, field: string): SortState | undefined {
  if (current?.field !== field) return { field, direction: "ASC" };
  if (current.direction === "ASC") return { field, direction: "DESC" };
  return undefined;
}

export type AriaSort = "ascending" | "descending" | "none";

export function getAriaSort(current: SortState | undefined, field: string): AriaSort {
  if (current?.field !== field) return "none";
  return current.direction === "ASC" ? "ascending" : "descending";
}
