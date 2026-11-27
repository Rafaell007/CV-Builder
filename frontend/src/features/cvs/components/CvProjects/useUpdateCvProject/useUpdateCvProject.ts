"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useCallback, useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import { readFailure } from "@/shared/failures";
import { CvProjectsDocument, UpdateCvProjectDocument } from "@/shared/graphql";
import type { CvProjectFormSubmit, CvProjectItem } from "../cvProjects.types";
import { useCvProjectForm } from "../useCvProjectForm";
import { useProjectRoles } from "../useProjectRoles";
import { toCvProjectFormValues, toProjectRange, toUpdateCvProjectInput } from "../utils";

/**
 * The Update project flow (page 23, Update Project): the CV project that is being changed, the open state of the
 * modal and the `updateCvProject` request. The form itself is `useCvProjectForm`. `open(cvProject)` fills it with
 * the current data. The project, and the fields that come from it, cannot change. A failed request keeps every typed
 * value and shows the error inside the modal. Only a successful request closes the modal, and the list loads again
 * because a new date can change the order.
 */
export function useUpdateCvProject() {
  const t = useTranslations("cvs.projects.update");
  const toast = useToast();
  const client = useApolloClient();
  // The CV project stays set while the modal fades out, so the request still has its id.
  const [cvProject, setCvProject] = useState<CvProjectItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const roles = useProjectRoles(isOpen);
  const [updateCvProject] = useMutation(UpdateCvProjectDocument);

  const rangeOf = useCallback(
    (projectId: string) =>
      cvProject !== null && projectId === cvProject.project.id
        ? toProjectRange(cvProject.project)
        : undefined,
    [cvProject],
  );
  const { form, error, reset, showError, submit: submitForm } = useCvProjectForm(rangeOf);

  function open(chosen: CvProjectItem) {
    reset(toCvProjectFormValues(chosen));
    setCvProject(chosen);
    setIsOpen(true);
  }

  async function send(values: CvProjectFormSubmit) {
    if (cvProject === null) return;
    try {
      await updateCvProject({
        variables: { input: toUpdateCvProjectInput(cvProject.id, values) },
        refetchQueries: [CvProjectsDocument],
      });
      setIsOpen(false);
      toast.success({
        title: t("success.title"),
        description: t("success.text", { name: cvProject.project.name }),
      });
    } catch (failure) {
      // Nothing resets the form here, so the values stay.
      showError(failure);
      // The entry is gone (or the CV is not visible any more): load the list again so the stale row leaves it.
      if (readFailure(failure).kind === "notFound") {
        void client.refetchQueries({ include: [CvProjectsDocument] });
      }
    }
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return {
    form,
    error,
    isOpen,
    open,
    setOpen: setIsOpen,
    submit,
    /** The project of the entry. It is shown in the disabled fields. */
    project: cvProject?.project,
    roles: roles.roles,
    rolesLoading: roles.loading,
    rolesFailed: roles.failed,
    retryRoles: roles.retry,
  };
}

export type UseUpdateCvProjectResult = ReturnType<typeof useUpdateCvProject>;
