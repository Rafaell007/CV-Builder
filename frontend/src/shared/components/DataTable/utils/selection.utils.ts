/** Adds the id when it is not selected, removes it when it is. */
export function toggleId(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
}

/** State of the "select all" checkbox for the rows on the current page. */
export function getSelectAllState(
  pageIds: readonly string[],
  selected: readonly string[],
): boolean | "indeterminate" {
  const count = pageIds.filter((id) => selected.includes(id)).length;
  if (count === 0) return false;
  return count === pageIds.length ? true : "indeterminate";
}

/** Selects every row of the page, or deselects them all when all are selected. Other pages keep their selection. */
export function toggleAll(pageIds: readonly string[], selected: readonly string[]): string[] {
  if (getSelectAllState(pageIds, selected) === true) {
    return selected.filter((id) => !pageIds.includes(id));
  }
  return [...selected, ...pageIds.filter((id) => !selected.includes(id))];
}
