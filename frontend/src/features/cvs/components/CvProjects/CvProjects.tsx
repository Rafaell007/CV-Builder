"use client";

import { useTranslations } from "next-intl";
import { Button, PageState, SearchField, type PageStateLabels } from "@/shared/components";
import { AddCvProjectModal } from "./AddCvProjectModal";
import { SEARCH_MAX_LENGTH } from "./cvProjects.constants";
import styles from "./CvProjects.module.css";
import { CvProjectsTable } from "./CvProjectsTable";
import { RemoveCvProjectModal } from "./RemoveCvProjectModal";
import { UpdateCvProjectModal } from "./UpdateCvProjectModal";
import { useAddCvProject } from "./useAddCvProject";
import { useCvProjects } from "./useCvProjects";
import { useCvProjectsListState } from "./useCvProjectsListState";
import { useRemoveCvProject } from "./useRemoveCvProject";
import { useUpdateCvProject } from "./useUpdateCvProject";
import { toCvProjectsVariables } from "./utils";

export interface CvProjectsProps {
  cvId: string;
}

/**
 * The content of the Projects tab (PLAN S7.4, KAN-116): search, the sortable table of the projects of the CV, ADD
 * PROJECT and the Update and Remove actions of each row, with the loading, empty, no results and error states. All
 * data comes from the backend, which also searches, sorts and decides who may change the CV: `CvLayout` shows this
 * page only after the backend returned the CV (the not found and no access states live there).
 */
export function CvProjects({ cvId }: CvProjectsProps) {
  const t = useTranslations("cvs.projects");
  const list = useCvProjectsListState();
  const variables = toCvProjectsVariables(cvId, list);
  const { projects, loading, failed, retry } = useCvProjects(variables);

  const adding = useAddCvProject(cvId);
  const updating = useUpdateCvProject();
  const removal = useRemoveCvProject(cvId);

  const stateLabels: PageStateLabels = {
    loading: t("states.loading"),
    empty: t("states.empty"),
    noResults: t("states.noResults"),
    error: t("states.error"),
    retry: t("states.retry"),
  };
  // A search that matched nothing is not the same as a CV without projects.
  const emptyKind = variables.search === undefined ? "empty" : "no-results";

  return (
    <div>
      {/* Outside the error branch below: an error must not remove the typed search (the field is uncontrolled). */}
      <div className={styles.toolbar}>
        <SearchField
          label={t("search.label")}
          placeholder={t("search.placeholder")}
          maxLength={SEARCH_MAX_LENGTH}
          defaultValue={list.search}
          onSearch={list.setSearch}
        />
        <Button onClick={adding.open}>{t("actions.add")}</Button>
      </div>
      {failed && !loading ? (
        <PageState kind="error" labels={stateLabels} onRetry={retry} />
      ) : (
        <CvProjectsTable
          projects={projects ?? []}
          sort={list.sort}
          onSortChange={list.setSort}
          onUpdate={updating.open}
          onDelete={removal.askToRemove}
          // The skeleton shows while there is no answer for this search and sort. A list that loads again after a
          // change keeps its rows, so the table does not blink.
          loading={projects === undefined}
          loadingContent={<PageState kind="loading" labels={stateLabels} />}
          emptyContent={<PageState kind={emptyKind} labels={stateLabels} />}
        />
      )}
      <AddCvProjectModal adding={adding} />
      <UpdateCvProjectModal updating={updating} />
      <RemoveCvProjectModal
        cvProject={removal.cvProject}
        pending={removal.pending}
        onConfirm={() => void removal.confirm()}
        onCancel={removal.cancel}
      />
    </div>
  );
}
