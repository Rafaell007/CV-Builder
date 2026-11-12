import type { KeyboardEvent, ReactNode } from "react";
import { Checkbox } from "radix-ui";
import type { DataTableColumn, DataTableLabels, SortState } from "./DataTable.types";
import { SortHeaderCell } from "./SortHeaderCell";
import { getSelectAllState, toggleAll, toggleId } from "./utils";
import styles from "./DataTable.module.css";

export interface DataTableProps<Row> {
  /** Accessible name of the table. */
  label: string;
  columns: readonly DataTableColumn<Row>[];
  /** Rows of the current page, as returned by the backend. */
  rows: readonly Row[];
  getRowId: (row: Row) => string;
  sort?: SortState | undefined;
  onSortChange?: (sort: SortState) => void;
  onRowClick?: (row: Row) => void;
  /** Slot at the end of each row, for example a button or a menu. Clicks in it do not click the row. */
  renderRowActions?: (row: Row) => ReactNode;
  selectable?: boolean;
  selectedIds?: readonly string[];
  onSelectionChange?: (ids: string[]) => void;
  /** While true the body shows `loadingContent` instead of the rows; the header stays. */
  loading?: boolean;
  loadingContent?: ReactNode;
  /** Shown when there are no rows and the table is not loading. */
  emptyContent?: ReactNode;
  labels?: Partial<DataTableLabels<Row>>;
}

const stopPropagation = (event: { stopPropagation: () => void }) => event.stopPropagation();

/** Table for a backend list: sortable headers, row click, row actions slot, row selection, loading and empty slots. */
export function DataTable<Row>({
  label,
  columns,
  rows,
  getRowId,
  sort,
  onSortChange,
  onRowClick,
  renderRowActions,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  loading = false,
  loadingContent,
  emptyContent,
  labels,
}: DataTableProps<Row>) {
  const text: DataTableLabels<Row> = {
    actions: "Actions",
    selectAll: "Select all rows",
    selectRow: (row) => `Select row ${getRowId(row)}`,
    ...labels,
  };
  const pageIds = rows.map(getRowId);
  const selectedLookup = new Set(selectedIds);
  const columnCount = columns.length + (selectable ? 1 : 0) + (renderRowActions ? 1 : 0);

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: Row) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick?.(row);
    }
  };

  const renderBody = () => {
    if (loading || rows.length === 0) {
      const content = loading ? loadingContent : emptyContent;
      return (
        <tr>
          <td className={styles.messageCell} colSpan={columnCount}>
            {content}
          </td>
        </tr>
      );
    }

    return rows.map((row) => {
      const id = getRowId(row);
      const selected = selectedLookup.has(id);
      return (
        <tr
          key={id}
          className={styles.row}
          data-clickable={onRowClick ? "" : undefined}
          data-selected={selected ? "" : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, row) : undefined}
        >
          {selectable && (
            <td className={styles.controlCell} onClick={stopPropagation}>
              <Checkbox.Root
                className={styles.checkbox}
                checked={selected}
                aria-label={text.selectRow(row)}
                onCheckedChange={() => onSelectionChange?.(toggleId(selectedIds, id))}
              >
                <Checkbox.Indicator className={styles.checkboxIndicator} />
              </Checkbox.Root>
            </td>
          )}
          {columns.map((column) => (
            <td key={column.id} className={styles.cell}>
              {column.cell(row)}
            </td>
          ))}
          {renderRowActions && (
            <td
              className={styles.controlCell}
              onClick={stopPropagation}
              onKeyDown={stopPropagation}
            >
              {renderRowActions(row)}
            </td>
          )}
        </tr>
      );
    });
  };

  return (
    <div className={styles.scroll}>
      <table className={styles.table} aria-label={label} aria-busy={loading}>
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className={styles.controlCell}>
                <Checkbox.Root
                  className={styles.checkbox}
                  checked={getSelectAllState(pageIds, selectedIds)}
                  disabled={loading || rows.length === 0}
                  aria-label={text.selectAll}
                  onCheckedChange={() => onSelectionChange?.(toggleAll(pageIds, selectedIds))}
                >
                  <Checkbox.Indicator className={styles.checkboxIndicator} />
                </Checkbox.Root>
              </th>
            )}
            {columns.map((column) =>
              column.sortField !== undefined && onSortChange ? (
                <SortHeaderCell
                  key={column.id}
                  header={column.header}
                  field={column.sortField}
                  sort={sort}
                  onSortChange={onSortChange}
                />
              ) : (
                <th key={column.id} scope="col" className={styles.headCell}>
                  {column.header}
                </th>
              ),
            )}
            {renderRowActions && (
              <th scope="col" className={styles.controlCell}>
                <span className={styles.visuallyHidden}>{text.actions}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>{renderBody()}</tbody>
      </table>
    </div>
  );
}
