import { ArrowUpwardIcon } from "../icons";
import type { SortState } from "./DataTable.types";
import { getAriaSort, getNextSort } from "./utils";
import styles from "./DataTable.module.css";

interface SortHeaderCellProps {
  header: string;
  field: string;
  sort: SortState | undefined;
  onSortChange: (sort: SortState) => void;
}

/** Header cell with a button that cycles the sort of its column; the arrow shows the direction. */
export function SortHeaderCell({ header, field, sort, onSortChange }: SortHeaderCellProps) {
  const ariaSort = getAriaSort(sort, field);

  return (
    <th scope="col" className={styles.headCell} aria-sort={ariaSort}>
      <button
        type="button"
        className={styles.sortButton}
        onClick={() => onSortChange(getNextSort(sort, field))}
      >
        {header}
        <ArrowUpwardIcon
          className={styles.sortIcon}
          data-direction={ariaSort === "none" ? undefined : ariaSort}
        />
      </button>
    </th>
  );
}
