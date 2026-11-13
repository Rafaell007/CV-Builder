"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState, type BaseSyntheticEvent } from "react";
import { useWatch } from "react-hook-form";
import { useToast } from "@/shared/components";
import { AddCvProjectDocument, CvProjectsDocument } from "@/shared/graphql";
import type { CvProjectFormSubmit } from "../cvProjects.types";
import { useCvProjectForm } from "../useCvProjectForm";
import { useProjectCatalog } from "../useProjectCatalog";
import { useProjectRoles } from "../useProjectRoles";
import {
  EMPTY_CV_PROJECT_FORM_VALUES,
  toAddCvProjectInput,
  toCvProjectFailure,
  toProjectRange,
} from "../utils";

/**
 * The Add project flow (page 23, Add Project): the open state of the modal, the project that is chosen and the
 * `addCvProject` request. The form itself is `useCvProjectForm`. The options come from the backend and are loaded
 * each time the modal opens: the catalog, the roles and the projects that the CV holds (they are not offered
 * again, AC-31). Choosing a project fills the two date fields with the days of the project; the user can narrow
 * them. A failed request keeps every typed value. Only a successful request closes the modal; the project appears
 * in the list when the backend has answered and the list is loaded again.
 */
export function useAddCvProject(cvId: string) {
  const t = useTranslations("cvs.projects.add");
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const catalog = useProjectCatalog(isOpen);
  const roles = useProjectRoles(isOpen);
  // The projects that the CV holds, with no search: the list on the page can show fewer rows than the CV has.
  const held = useQuery(CvProjectsDocument, {
    variables: { cvId },
    skip: !isOpen,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });
  const [addCvProject] = useMutation(AddCvProjectDocument);

  const rangeOf = useCallback(
    (projectId: string) => {
      const found = catalog.projects?.find((item) => item.id === projectId);
      return found === undefined ? undefined : toProjectRange(found);
    },
    [catalog.projects],
  );
  const { form, error, reset, showError, submit: submitForm } = useCvProjectForm(rangeOf);
  const projectId = useWatch({ control: form.control, name: "projectId" });
  const project = catalog.projects?.find((item) => item.id === projectId);

  // The catalog without the projects that the CV holds. `undefined` until both answers are here.
  const heldProjects = held.data?.cvProjects;
  const options = useMemo(() => {
    if (catalog.projects === undefined || heldProjects === undefined) return undefined;
    const heldIds = new Set(heldProjects.map((item) => item.project.id));
    return catalog.projects.filter((item) => !heldIds.has(item.id));
  }, [catalog.projects, heldProjects]);

  function retryProjects() {
    catalog.retry();
    void held.refetch().catch(() => undefined);
  }

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
      if (toCvProjectFailure(failure) === "conflict") retryProjects();
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
    options,
    optionsLoading: catalog.loading || held.loading,
    optionsFailed: catalog.failed || held.error !== undefined,
    retryProjects,
    roles: roles.roles,
    rolesLoading: roles.loading,
    rolesFailed: roles.failed,
    retryRoles: roles.retry,
  };
}

export type UseAddCvProjectResult = ReturnType<typeof useAddCvProject>;
