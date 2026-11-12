"use client";

import { useTranslations } from "next-intl";
import { PageState } from "@/shared/components";
import { ProjectsTable } from "./components/ProjectsTable";
import { useProjects } from "./useProjects";
import styles from "./Projects.module.css";

/** Content of the `/admin/projects` page: the list of projects, with its loading, empty and error states. */
export function Projects() {
  const t = useTranslations("projects");
  const { projects, loading, failed, retry } = useProjects();

  const stateLabels = {
    loading: t("states.loading"),
    empty: t("states.empty"),
    error: t("states.error"),
    retry: t("states.retry"),
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>
      {failed && !loading ? (
        <PageState kind="error" labels={stateLabels} onRetry={retry} />
      ) : (
        <ProjectsTable
          projects={projects}
          loading={loading}
          loadingContent={<PageState kind="loading" labels={stateLabels} />}
          emptyContent={<PageState kind="empty" labels={stateLabels} />}
        />
      )}
    </main>
  );
}
