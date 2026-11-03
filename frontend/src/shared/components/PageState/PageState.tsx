import type { PageStateKind, PageStateLabels } from "./PageState.types";
import { DEFAULT_PAGE_STATE_LABELS, DEFAULT_SKELETON_ROWS } from "./pageState.constants";
import styles from "./PageState.module.css";

export interface PageStateProps {
  kind: PageStateKind;
  /** Repeats the failed request. Without it, the error state has no retry button. */
  onRetry?: () => void;
  /** Number of skeleton rows in the loading state. */
  rows?: number;
  labels?: Partial<PageStateLabels>;
}

/**
 * Loading skeleton, empty list, search without results, or a failed request with a retry button.
 * Empty and no results are separate states: neither is an error.
 */
export function PageState({ kind, onRetry, rows = DEFAULT_SKELETON_ROWS, labels }: PageStateProps) {
  const text = { ...DEFAULT_PAGE_STATE_LABELS, ...labels };

  if (kind === "loading") {
    return (
      <div className={styles.skeleton} role="status" aria-busy="true" aria-label={text.loading}>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className={styles.row} />
        ))}
      </div>
    );
  }

  if (kind === "error") {
    return (
      <div className={styles.message} role="alert">
        <p className={styles.text}>{text.error}</p>
        {onRetry && (
          <button type="button" className={styles.retry} onClick={onRetry}>
            {text.retry}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.message} role="status">
      <p className={styles.text}>{kind === "empty" ? text.empty : text.noResults}</p>
    </div>
  );
}
