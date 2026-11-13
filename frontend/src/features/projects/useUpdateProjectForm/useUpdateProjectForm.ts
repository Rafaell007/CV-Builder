"use client";

import { useTranslations } from "next-intl";
import { useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { ProjectFormSubmit, ProjectFormValues, ProjectListItem } from "../projects.types";
import { useProjectForm } from "../useProjectForm";
import { useUpdateProject } from "../useUpdateProject";
import { toProjectFormValues, toUpdateProjectInput } from "../utils";

// The form needs values before a project is chosen; `open` replaces them with the data of the project.
const EMPTY_VALUES: ProjectFormValues = {
  name: "",
  domain: "",
  startDate: null,
  endDate: null,
  description: "",
  environmentIds: [],
};

/**
 * The Update project flow (page 27, Update Project): the project that is being edited, the open state of the
 * modal and the request. The form itself is `useProjectForm`. `open(project)` fills it with the current data of
 * that project. A failed request keeps every typed value and shows the error inside the modal. Only a
 * successful request closes the modal.
 */
export function useUpdateProjectForm() {
  const t = useTranslations("projects.update");
  const toast = useToast();
  const { update } = useUpdateProject();
  const { form, failed, reset, showError, submit: submitForm } = useProjectForm(EMPTY_VALUES);
  // The project stays set while the modal fades out, so the request still has its id.
  const [project, setProject] = useState<ProjectListItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function open(chosen: ProjectListItem) {
    reset(toProjectFormValues(chosen));
    setProject(chosen);
    setIsOpen(true);
  }

  async function send(values: ProjectFormSubmit) {
    if (!project) return;
    try {
      await update(toUpdateProjectInput(project, values));
      setIsOpen(false);
      toast.success({
        title: t("success.title"),
        description: t("success.text", { name: values.name }),
      });
    } catch (error) {
      // Nothing resets the form here, so the values stay.
      showError(error);
    }
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return { form, isOpen, open, setOpen: setIsOpen, submit, failed };
}

export type UseUpdateProjectFormResult = ReturnType<typeof useUpdateProjectForm>;
