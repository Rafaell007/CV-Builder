"use client";

import { useSyncExternalStore } from "react";
import type { DataTableColumn } from "./DataTable.types";
import { getHiddenColumnIds } from "./utils";

const SEPARATOR = "\u0000";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/**
 * The columns that fit the window: a column with `hideBelow` is left out below that width.
 * The server does not know the width, so it renders every column; the browser corrects it on load.
 */
export function useVisibleColumns<Row>(
  columns: readonly DataTableColumn<Row>[],
): readonly DataTableColumn<Row>[] {
  // The snapshot is a string, so React re-renders only when a column appears or disappears,
  // not on every pixel of a resize.
  const hiddenKey = useSyncExternalStore(
    subscribe,
    () => getHiddenColumnIds(columns, window.innerWidth).join(SEPARATOR),
    () => "",
  );
  if (hiddenKey === "") return columns;
  const hidden = new Set(hiddenKey.split(SEPARATOR));
  return columns.filter((column) => !hidden.has(column.id));
}
