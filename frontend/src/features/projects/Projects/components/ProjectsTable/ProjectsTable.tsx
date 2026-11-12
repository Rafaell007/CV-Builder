import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { DataTable, type DataTableColumn } from "@/shared/components";
import type { ProjectListItem } from "../../projects.types";
import { EnvironmentTags } from "./EnvironmentTags";
import { formatProjectDate } from "./utils";
import styles from "./ProjectsTable.module.css";

export interface ProjectsTableProps {
  projects: readonly ProjectListItem[];
  loading: boolean;
  loadingContent: ReactNode;
  emptyContent: ReactNode;
}

/** The projects as a table: name (with description and environment tags), domain, start date, end date. */
export function ProjectsTable({
  projects,
  loading,
  loadingContent,
  emptyContent,
}: ProjectsTableProps) {
  const t = useTranslations("projects");
  const locale = useLocale();

  // The table draws one line for each project, so the description and the tags sit under the name.
  const columns: DataTableColumn<ProjectListItem>[] = [
    {
      id: "name",
      header: t("columns.name"),
      cell: (project) => (
        <div className={styles.summary}>
          <span className={styles.name}>{project.name}</span>
          <p className={styles.description}>{project.description}</p>
          <EnvironmentTags items={project.environment} label={t("environment")} />
        </div>
      ),
    },
    { id: "domain", header: t("columns.domain"), cell: (project) => project.domain },
    {
      id: "startDate",
      header: t("columns.startDate"),
      cell: (project) => formatProjectDate(project.startDate, locale),
    },
    {
      id: "endDate",
      header: t("columns.endDate"),
      cell: (project) => formatProjectDate(project.endDate, locale),
    },
  ];

  return (
    <DataTable
      label={t("table")}
      columns={columns}
      rows={projects}
      getRowId={(project) => project.id}
      loading={loading}
      loadingContent={loadingContent}
      emptyContent={emptyContent}
    />
  );
}
