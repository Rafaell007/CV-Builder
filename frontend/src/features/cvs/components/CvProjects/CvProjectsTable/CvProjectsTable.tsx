import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  DataTable,
  Menu,
  ProjectDescription,
  type DataTableColumn,
  type SortState,
} from "@/shared/components";
import { DESKTOP_MIN_WIDTH } from "@/shared/constants";
import { formatCalendarDate } from "@/shared/utils";
import { CV_PROJECT_SORT_FIELDS } from "../cvProjects.constants";
import type { CvProjectItem } from "../cvProjects.types";
import { toResponsibilityTags } from "../utils";
import styles from "./CvProjectsTable.module.css";
import { ResponsibilityTags } from "./ResponsibilityTags";

export interface CvProjectsTableProps {
  projects: readonly CvProjectItem[];
  /** The backend sort. The table only shows it and reports a click on a header. */
  sort: SortState | undefined;
  onSortChange: (sort: SortState) => void;
  /** Called with the CV project when the user selects Update in its row menu. */
  onUpdate: (cvProject: CvProjectItem) => void;
  /** Called with the CV project when the user selects Delete in its row menu. */
  onDelete: (cvProject: CvProjectItem) => void;
  loading: boolean;
  loadingContent: ReactNode;
  emptyContent: ReactNode;
}

/**
 * The projects of a CV as a table: Name and Domain (from the catalog project), Start Date and End Date (from the CV),
 * and a line under each row with the description of the catalog project and the responsibilities of the CV as tags.
 * Name, Start Date and End Date sort on the backend; the table never sorts the rows it holds.
 * An empty end date shows Present. Each row has a three-dot menu with Update and Delete.
 */
export function CvProjectsTable({
  projects,
  sort,
  onSortChange,
  onUpdate,
  onDelete,
  loading,
  loadingContent,
  emptyContent,
}: CvProjectsTableProps) {
  const t = useTranslations("cvs.projects");
  const locale = useLocale();

  // A date that cannot be read shows a dash, with a text for screen readers, never an empty cell.
  const renderDate = (value: string): ReactNode => {
    const text = formatCalendarDate(value, locale);
    return (
      text ?? (
        <span role="img" aria-label={t("dateMissing")}>
          &mdash;
        </span>
      )
    );
  };

  const columns: DataTableColumn<CvProjectItem>[] = [
    {
      id: "name",
      header: t("columns.name"),
      sortField: CV_PROJECT_SORT_FIELDS.name,
      cell: (item) => <span className={styles.text}>{item.project.name}</span>,
    },
    {
      id: "domain",
      header: t("columns.domain"),
      hideBelow: DESKTOP_MIN_WIDTH,
      cell: (item) => <span className={styles.text}>{item.project.domain}</span>,
    },
    {
      id: "startDate",
      header: t("columns.startDate"),
      sortField: CV_PROJECT_SORT_FIELDS.startDate,
      cell: (item) => renderDate(item.startDate),
    },
    {
      id: "endDate",
      header: t("columns.endDate"),
      sortField: CV_PROJECT_SORT_FIELDS.endDate,
      cell: (item) => (item.endDate === null ? t("present") : renderDate(item.endDate)),
    },
  ];

  return (
    <DataTable
      label={t("table")}
      columns={columns}
      rows={projects}
      getRowId={(item) => item.id}
      sort={sort}
      onSortChange={onSortChange}
      lastRowLine={false}
      renderRowDetail={(item) => (
        <div className={styles.detail}>
          <ProjectDescription text={item.project.description} />
          <ResponsibilityTags
            items={toResponsibilityTags(item.responsibilities)}
            label={t("responsibilities")}
          />
        </div>
      )}
      renderRowActions={(item) => (
        <Menu
          label={t("actions.menu", { name: item.project.name })}
          items={[
            { label: t("actions.update"), onSelect: () => onUpdate(item) },
            { label: t("actions.delete"), onSelect: () => onDelete(item), destructive: true },
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
