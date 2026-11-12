import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { DataTable, Menu, type DataTableColumn, type SortState } from "@/shared/components";
import { PROJECT_SORT_FIELDS } from "../../projects.constants";
import type { ProjectListItem } from "../../projects.types";
import { EnvironmentTags } from "./EnvironmentTags";
import { ProjectDescription } from "./ProjectDescription";
import { formatProjectDate } from "./utils";
import styles from "./ProjectsTable.module.css";

export interface ProjectsTableProps {
  projects: readonly ProjectListItem[];
  /** The backend sort. The table only shows it and reports a click on a header. */
  sort: SortState | undefined;
  onSortChange: (sort: SortState) => void;
  /** Called with the project when the user selects Edit in its row menu. */
  onEdit: (project: ProjectListItem) => void;
  /** Called with the project when the user selects Delete in its row menu. */
  onDelete: (project: ProjectListItem) => void;
  loading: boolean;
  loadingContent: ReactNode;
  emptyContent: ReactNode;
}

/**
 * The projects as a table: name (with description and environment tags), domain, start date, end date.
 * Name, Start Date and End Date sort on the backend; the table never sorts the rows it holds.
 */
export function ProjectsTable({
  projects,
  sort,
  onSortChange,
  onEdit,
  onDelete,
  loading,
  loadingContent,
  emptyContent,
}: ProjectsTableProps) {
  const t = useTranslations("projects");
  const locale = useLocale();

  // A date that cannot be read shows a dash, with a text for screen readers, never an empty cell.
  const renderDate = (value: string): ReactNode => {
    const text = formatProjectDate(value, locale);
    return (
      text ?? (
        <span role="img" aria-label={t("dateMissing")}>
          &mdash;
        </span>
      )
    );
  };

  // The table draws one line for each project, so the description and the tags sit under the name.
  const columns: DataTableColumn<ProjectListItem>[] = [
    {
      id: "name",
      header: t("columns.name"),
      sortField: PROJECT_SORT_FIELDS.name,
      cell: (project) => (
        <div className={styles.summary}>
          <span className={styles.name}>{project.name}</span>
          <ProjectDescription text={project.description} />
          <EnvironmentTags items={project.environment} label={t("environment")} />
        </div>
      ),
    },
    { id: "domain", header: t("columns.domain"), cell: (project) => project.domain },
    {
      id: "startDate",
      header: t("columns.startDate"),
      sortField: PROJECT_SORT_FIELDS.startDate,
      cell: (project) => renderDate(project.startDate),
    },
    {
      id: "endDate",
      header: t("columns.endDate"),
      sortField: PROJECT_SORT_FIELDS.endDate,
      cell: (project) => renderDate(project.endDate),
    },
  ];

  return (
    <div className={styles.table}>
      <DataTable
        label={t("table")}
        columns={columns}
        rows={projects}
        getRowId={(project) => project.id}
        sort={sort}
        onSortChange={onSortChange}
        renderRowActions={(project) => (
          <Menu
            label={t("actions.menu", { name: project.name })}
            items={[
              { label: t("actions.edit"), onSelect: () => onEdit(project) },
              { label: t("actions.delete"), onSelect: () => onDelete(project), destructive: true },
            ]}
          />
        )}
        labels={{ actions: t("actions.column") }}
        loading={loading}
        loadingContent={loadingContent}
        emptyContent={emptyContent}
      />
    </div>
  );
}
