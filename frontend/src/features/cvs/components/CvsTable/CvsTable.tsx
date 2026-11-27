import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { DataTable, Menu, type DataTableColumn, type SortState } from "@/shared/components";
import { DESKTOP_MIN_WIDTH } from "@/shared/constants";
import { CV_SORT_FIELDS } from "../../cvs.constants";
import type { CvListItem } from "../../cvs.types";
import { CvDescription } from "./CvDescription";
import styles from "./CvsTable.module.css";

export interface CvsTableProps {
  cvs: readonly CvListItem[];
  /** The backend sort. The table only shows it and reports a click on a header. */
  sort: SortState | undefined;
  onSortChange: (sort: SortState) => void;
  /** Called with the CV when the user selects View in its row menu, or clicks the row. */
  onView: (cv: CvListItem) => void;
  /** Called with the CV when the user selects Edit in its row menu. */
  onEdit: (cv: CvListItem) => void;
  /** Called with the CV when the user selects Delete in its row menu. */
  onDelete: (cv: CvListItem) => void;
  loading: boolean;
  loadingContent: ReactNode;
  emptyContent: ReactNode;
}

/**
 * The CVs as a table: name, education and employee (the owner email; hidden on a tablet, as in Figma), and the
 * description in a line under each row (cut after three lines on a tablet; a click on it shows all of it and does
 * not open the CV).
 * Only Name sorts, on the backend; the table never sorts the rows it holds.
 * A click on a row opens the CV, like View in the row menu.
 */
export function CvsTable({
  cvs,
  sort,
  onSortChange,
  onView,
  onEdit,
  onDelete,
  loading,
  loadingContent,
  emptyContent,
}: CvsTableProps) {
  const t = useTranslations("cvs");

  const columns: DataTableColumn<CvListItem>[] = [
    {
      id: "name",
      header: t("columns.name"),
      sortField: CV_SORT_FIELDS.name,
      cell: (cv) => <span className={styles.text}>{cv.name}</span>,
    },
    {
      id: "education",
      header: t("columns.education"),
      cell: (cv) => <span className={styles.text}>{cv.education}</span>,
    },
    {
      id: "employee",
      header: t("columns.employee"),
      hideBelow: DESKTOP_MIN_WIDTH,
      cell: (cv) => <span className={styles.text}>{cv.ownerEmail}</span>,
    },
  ];

  return (
    <DataTable
      label={t("table")}
      columns={columns}
      rows={cvs}
      getRowId={(cv) => cv.id}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={onView}
      renderRowDetail={(cv) => <CvDescription text={cv.description} />}
      renderRowActions={(cv) => (
        <Menu
          label={t("actions.menu", { name: cv.name })}
          items={[
            { label: t("actions.view"), onSelect: () => onView(cv) },
            { label: t("actions.edit"), onSelect: () => onEdit(cv) },
            { label: t("actions.delete"), onSelect: () => onDelete(cv), destructive: true },
          ]}
        />
      )}
      labels={{ actions: t("actions.column") }}
      loading={loading}
      loadingContent={loadingContent}
      emptyContent={emptyContent}
    />
  );
}
