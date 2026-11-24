"use client";

import type { Reference } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { readFailure } from "@/shared/failures";
import { CvProjectsDocument, RemoveCvProjectsDocument } from "@/shared/graphql";
import type { CvProjectItem } from "../cvProjects.types";

/**
 * The Remove project flow (page 23, Delete Project): the project that waits for the confirmation and the
 * `removeCvProjects` request. `askToRemove` opens the confirmation, CANCEL closes it without a request. The project
 * leaves the list only after the backend answered: the answer takes it out of the cached list and the list loads
 * again. The project of the catalog stays (AC-23). On failure the confirmation closes and a toast shows the reason
 * (a toast stays behind an open modal where a keyboard user cannot reach it); the project stays in the list.
 */
export function useRemoveCvProject(cvId: string) {
  const t = useTranslations("cvs.projects.remove");
  const toast = useToast();
  const client = useApolloClient();
  const [cvProject, setCvProject] = useState<CvProjectItem | null>(null);
  const [removeCvProjects, { loading }] = useMutation(RemoveCvProjectsDocument);

  // A ref changes at once, `loading` only after the next render: two calls in the same tick cannot both pass.
  const sending = useRef(false);

  async function confirm(): Promise<boolean> {
    if (cvProject === null || sending.current) return false;
    sending.current = true;
    const { id, project } = cvProject;
    try {
      await removeCvProjects({
        variables: { input: { cvId, ids: [id] } },
        update: (cache) => {
          // Leave the removed project out of every cached list (each search and sort has one) instead of
          // evicting it: an evicted entry makes the cached list incomplete, and the page would fall back to
          // the loading state until the list loads again.
          cache.modify({
            fields: {
              cvProjects: (existing: readonly Reference[] = [], { readField }) =>
                existing.filter((ref) => readField<string>("id", ref) !== id),
            },
          });
          cache.gc();
        },
        // The list loads again, so it shows what the backend holds now.
        refetchQueries: [CvProjectsDocument],
      });
      setCvProject(null);
      toast.success({
        title: t("success.title"),
        description: t("success.text", { name: project.name }),
      });
      return true;
    } catch (failure) {
      setCvProject(null);
      const { kind } = readFailure(failure);
      // The entry is already gone (or the CV is not visible any more): load the list again so it leaves it.
      if (kind === "notFound") void client.refetchQueries({ include: [CvProjectsDocument] });
      toast.error({
        title: t("failedTitle"),
        description: t(kind === "notFound" || kind === "forbidden" ? kind : "failedText"),
      });
      return false;
    } finally {
      sending.current = false;
    }
  }

  return {
    /** The project that waits for the confirmation. The modal is open while this is set. */
    cvProject,
    pending: loading,
    askToRemove: setCvProject,
    cancel: () => setCvProject(null),
    confirm,
  };
}

export type UseRemoveCvProjectResult = ReturnType<typeof useRemoveCvProject>;
