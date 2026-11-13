import type { DataTableColumn } from "../DataTable.types";

/** The ids of the columns that a window of this width hides (`hideBelow` is larger than the width). */
export function getHiddenColumnIds<Row>(
  columns: readonly DataTableColumn<Row>[],
  width: number,
): string[] {
  return columns
    .filter((column) => column.hideBelow !== undefined && width < column.hideBelow)
    .map((column) => column.id);
}
