import type { PageItem } from "../Pagination.types";

/** Number of pages needed for `total` rows; 0 when there are no rows. */
export function getPageCount(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}

/**
 * The slots to show: first and last page, the current page with one neighbour on each side,
 * and "ellipsis" for each gap. A gap of exactly one page shows that page instead of "…".
 * Example: page 5 of 10 → 1 … 4 5 6 … 10.
 */
export function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 0) return [];

  const current = Math.min(Math.max(page, 1), pageCount);
  const wanted = new Set([1, pageCount, current - 1, current, current + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);

  const items: PageItem[] = [];
  let previous = 0;
  for (const n of pages) {
    if (n - previous === 2) items.push(previous + 1);
    else if (n - previous > 2) items.push("ellipsis");
    items.push(n);
    previous = n;
  }
  return items;
}
