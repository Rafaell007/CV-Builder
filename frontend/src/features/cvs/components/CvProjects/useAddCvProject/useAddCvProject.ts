"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useCallback, useState, type BaseSyntheticEvent } from "react";
import { useWatch } from "react-hook-form";
import { useToast } from "@/shared/components";
import { readFailure } from "@/shared/failures";
import { AddCvProjectDocument, CvProjectsDocument } from "@/shared/graphql";
import type { CvProjectFormSubmit } from "../cvProjects.types";
import { useCvProjectForm } from "../useCvProjectForm";
import { useAvailableCvProjects } from "../useAvailableCvProjects";
import { useProjectRoles } from "../useProjectRoles";
import { EMPTY_CV_PROJECT_FORM_VALUES, toAddCvProjectInput, toProjectRange } from "../utils";

/**
 * The Add project flow (page 23, Add Project): the open state of the modal, the project that is chosen and the
 * `addCvProject` request. The form itself is `useCvProjectForm`. The options come from the backend and are loaded
 * each time the modal opens: the projects that can be added (the backend leaves out the projects that the CV
 * holds, AC-31) and the roles. Choosing a project fills the two date fields with the days of the project; the
 * user can narrow them. A failed request keeps every typed value. Only a successful request closes the modal; the project appears
 * in the list when the backend has answered and the list is loaded again.
 */
export function useAddCvProject(cvId: string) {
  const t = useTranslations("cvs.projects.add");
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const available = useAvailableCvProjects(cvId, isOpen);
  const roles = useProjectRoles(isOpen);
  const [addCvProject] = useMutation(AddCvProjectDocument);

  const rangeOf = useCallback(
    (projectId: string) => {
      const found = available.options?.find((item) => item.id === projectId);
      return found === undefined ? undefined : toProjectRange(found);
    },
    [available.options],
  );
  const { form, error, reset, showError, submit: submitForm } = useCvProjectForm(rangeOf);
  const projectId = useWatch({ control: form.control, name: "projectId" });
  const project = available.options?.find((item) => item.id === projectId);

  function open() {
    reset(EMPTY_CV_PROJECT_FORM_VALUES);
    setIsOpen(true);
  }

  /** Chooses the project and fills the dates with its days (page 23: the project dates are filled in). */
  function selectProject(id: string) {
    const options = { shouldDirty: true, shouldTouch: true, shouldValidate: true };
    form.setValue("projectId", id, options);
    const range = rangeOf(id);
    if (range === undefined) return;
    form.setValue("startDate", range.start, options);
    form.setValue("endDate", range.end, options);
  }

  async function send(values: CvProjectFormSubmit) {
    try {
      const { data } = await addCvProject({
        variables: { input: toAddCvProjectInput(cvId, values) },
        // The list loads again for the new project; the backend decides its place in the order.
        refetchQueries: [CvProjectsDocument],
      });
      setIsOpen(false);
      toast.success({
        title: t("success.title"),
        description: t("success.text", { name: data?.addCvProject.project.name ?? "" }),
      });
    } catch (failure) {
      // Nothing resets the form here, so the values stay.
      showError(failure);
      // The project is already in the CV, or a date changed: the options are old, so load them again.
      if (readFailure(failure).kind === "conflict") available.retry();
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
    project,
    selectProject,
    options: available.options,
    optionsLoading: available.loading,
    optionsFailed: available.failed,
    retryProjects: available.retry,
    roles: roles.roles,
    rolesLoading: roles.loading,
    rolesFailed: roles.failed,
    retryRoles: roles.retry,
  };
}

export type UseAddCvProjectResult = ReturnType<typeof useAddCvProject>;
