"use client";

import { useTranslations } from "next-intl";
import {
  Button,
  PageState,
  Pagination,
  SearchField,
  type PageStateLabels,
} from "@/shared/components";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { DeleteProjectModal } from "./components/DeleteProjectModal";
import { ProjectsTable } from "./components/ProjectsTable";
import { SEARCH_MAX_LENGTH } from "./projects.constants";
import { toProjectsVariables } from "./utils";
import { useCreateProjectForm } from "./useCreateProjectForm";
import { useDeleteProject } from "./useDeleteProject";
import { useProjects } from "./useProjects";
import { useProjectsListState } from "./useProjectsListState";
import styles from "./Projects.module.css";

/**
 * Content of the `/admin/projects` page: search, the sortable list of projects and the page buttons,
 * with the loading, empty, no results and error states. The backend searches, sorts and cuts the pages.
 */
export function Projects() {
  const t = useTranslations("projects");
  const list = useProjectsListState();
  const variables = toProjectsVariables(list);
  const { projects, total, loading, failed, retry } = useProjects(variables);

  const creation = useCreateProjectForm();
  const deletion = useDeleteProject();

  // Placeholder: the update modal fills this in the next slice.
  const handleEdit = () => undefined;

  async function handleConfirmDelete() {
    // Read before the request: the project leaves the list while it runs.
    const wasLastRowOfPage = projects.length === 1 && list.page > 1;
    const deleted = await deletion.confirm();
    // The same page would now be empty, so go back one page.
    if (deleted && wasLastRowOfPage) list.setPage(list.page - 1);
  }

  const stateLabels: PageStateLabels = {
    loading: t("states.loading"),
    empty: t("states.empty"),
    noResults: t("states.noResults"),
    error: t("states.error"),
    retry: t("states.retry"),
  };
  // A search that matched nothing is not the same as a catalog without projects.
  const emptyKind = variables.search === undefined ? "empty" : "no-results";

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t("title")}</h1>
      {/* Outside the error branch below: an error must not remove the typed search (the field is uncontrolled). */}
      <div className={styles.toolbar}>
        <SearchField
          label={t("search.label")}
          placeholder={t("search.placeholder")}
          maxLength={SEARCH_MAX_LENGTH}
          defaultValue={list.search}
          onSearch={list.setSearch}
        />
        <Button onClick={creation.open}>{t("button")}</Button>
      </div>
      {failed && !loading ? (
        <PageState kind="error" labels={stateLabels} onRetry={retry} />
      ) : (
        <>
          <ProjectsTable
            projects={projects}
            sort={list.sort}
            onSortChange={list.setSort}
            onEdit={handleEdit}
            onDelete={deletion.askToDelete}
            loading={loading}
            loadingContent={<PageState kind="loading" labels={stateLabels} />}
            emptyContent={<PageState kind={emptyKind} labels={stateLabels} />}
          />
          <div className={styles.pagination}>
            <Pagination
              page={list.page}
              total={total}
              onPageChange={list.setPage}
              labels={{
                navigation: t("pagination.navigation"),
                previous: t("pagination.previous"),
                next: t("pagination.next"),
                page: (number) => t("pagination.page", { number }),
              }}
            />
          </div>
        </>
      )}
      <CreateProjectModal creation={creation} />
      <DeleteProjectModal
        project={deletion.project}
        pending={deletion.pending}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={deletion.cancel}
      />
    </main>
  );
}
