import type { ReactNode } from "react";
import { Button } from "../Button";
import { AddIcon } from "../icons";
import styles from "./ListPage.module.css";

export interface ListPageProps {
  /** The search field at the left of the toolbar (the shared `SearchField`). */
  search: ReactNode;
  /** Text of the create button, for example "Create project". Below 1024px only the plus icon shows; the text stays its accessible name. */
  createLabel: string;
  onCreate: () => void;
  /** When set, it is shown instead of the list and the page buttons: the error state with Retry. */
  error?: ReactNode;
  /** The page buttons under the list (the shared `Pagination`). */
  pagination: ReactNode;
  /** The list itself (a table). */
  children: ReactNode;
}

/**
 * The body of a list page under the route's `PageHeader`: the sticky toolbar with the search field and the create
 * button, the list and the page buttons. An error replaces the list and the page buttons, but not the toolbar, so the
 * typed search stays. Modals are rendered by the caller next to it.
 */
export function ListPage({
  search,
  createLabel,
  onCreate,
  error,
  pagination,
  children,
}: ListPageProps) {
  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.search}>{search}</div>
        <Button variant="text" className={styles.createButton} onClick={onCreate}>
          <AddIcon className={styles.createIcon} />
          <span className={styles.createLabel}>{createLabel}</span>
        </Button>
      </div>
      {error ?? (
        <>
          {children}
          <div className={styles.pagination}>{pagination}</div>
        </>
      )}
    </div>
  );
}
