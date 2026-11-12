"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/shared/components";
import { DeleteProjectDocument, ProjectsDocument } from "@/shared/graphql";
import type { ProjectListItem } from "../projects.types";
import { toDeleteProjectFailure } from "../utils";

export type UseDeleteProjectResult = {
  /** The project the user chose to delete. The modal is open while this is set. */
  project: ProjectListItem | null;
  /** True while the request runs. */
  pending: boolean;
  /** Opens the confirmation for this project. */
  request: (project: ProjectListItem) => void;
  /** Closes the confirmation without a request. */
  cancel: () => void;
  /** Sends `deleteProject` for the chosen project. A second call while one runs does nothing. */
  confirm: () => Promise<void>;
};

/**
 * State of the delete flow: which project waits for confirmation, and the `deleteProject` request (AC-30 to AC-37).
 * On success the project leaves the cache (its row disappears at once), the list is loaded again for the new total,
 * and the modal closes. On failure the modal closes too and an error toast shows the reason: a toast stays behind an
 * open modal where a keyboard user cannot reach it (see the Toast README).
 */
export function useDeleteProject(): UseDeleteProjectResult {
  const t = useTranslations("projects.delete");
  const toast = useToast();
  const [project, setProject] = useState<ProjectListItem | null>(null);
  const [deleteProject, { loading }] = useMutation(DeleteProjectDocument);

  async function confirm() {
    // `loading` blocks a second request (AC "no double send"), also when Enter is pressed twice.
    if (project === null || loading) return;
    try {
      await deleteProject({
        variables: { id: project.id },
        update: (cache) => {
          const id = cache.identify(project);
          if (id === undefined) return;
          cache.evict({ id });
          cache.gc();
        },
        // The total and the pages change: the open list loads again with the same search, sort and page.
        refetchQueries: [ProjectsDocument],
      });
      setProject(null);
    } catch (error) {
      setProject(null);
      toast.error({
        title: t("failedTitle"),
        description: toDeleteProjectFailure(error) ?? t("failedText"),
      });
    }
  }

  return {
    project,
    pending: loading,
    request: setProject,
    cancel: () => setProject(null),
    confirm,
  };
}
