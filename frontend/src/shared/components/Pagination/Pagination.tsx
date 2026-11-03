import type { PaginationLabels } from "./Pagination.types";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGINATION_LABELS } from "./pagination.constants";
import { getPageCount, getPageItems } from "./utils";
import styles from "./Pagination.module.css";

export interface PaginationProps {
  /** Current page, starting at 1. */
  page: number;
  /** Total number of rows that match the query (the `total` of a list response). */
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  labels?: Partial<PaginationLabels>;
}

/** Page buttons for a backend list. Renders nothing when all rows fit on one page. */
export function Pagination({
  page,
  total,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  labels,
}: PaginationProps) {
  const pageCount = getPageCount(total, pageSize);
  if (pageCount <= 1) return null;

  const text = { ...DEFAULT_PAGINATION_LABELS, ...labels };
  const current = Math.min(Math.max(page, 1), pageCount);

  return (
    <nav aria-label={text.navigation}>
      <ul className={styles.list}>
        <li>
          <button
            type="button"
            className={styles.button}
            aria-label={text.previous}
            disabled={current === 1}
            onClick={() => onPageChange(current - 1)}
          >
            ‹
          </button>
        </li>
        {getPageItems(current, pageCount).map((item, index) =>
          item === "ellipsis" ? (
            <li key={`gap-${index}`} className={styles.gap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={styles.button}
                aria-label={text.page(item)}
                aria-current={item === current ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={styles.button}
            aria-label={text.next}
            disabled={current === pageCount}
            onClick={() => onPageChange(current + 1)}
          >
            ›
          </button>
        </li>
      </ul>
    </nav>
  );
}
