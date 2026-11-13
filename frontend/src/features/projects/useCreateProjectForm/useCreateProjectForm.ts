"use client";

import { useTranslations } from "next-intl";
import { useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { ProjectFormSubmit, ProjectFormValues } from "../projects.types";
import { useCreateProject } from "../useCreateProject";
import { useProjectForm } from "../useProjectForm";
import { toCreateProjectInput } from "../utils";

const EMPTY_VALUES: ProjectFormValues = {
  name: "",
  domain: "",
  startDate: null,
  endDate: null,
  description: "",
  environmentIds: [],
};

/**
 * The Create project flow (page 27, Create Project): the open state of the modal and the request. The form
 * itself is `useProjectForm`. It is empty each time the modal opens. A failed request keeps every typed value
 * and shows the error inside the modal. Only a successful request closes the modal.
 */
export function useCreateProjectForm() {
  const t = useTranslations("projects.create");
  const toast = useToast();
  const { create } = useCreateProject();
  const { form, failed, reset, showError, submit: submitForm } = useProjectForm(EMPTY_VALUES);
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    reset(EMPTY_VALUES);
    setIsOpen(true);
  }

  async function send(values: ProjectFormSubmit) {
    try {
      await create(toCreateProjectInput(values));
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

export type UseCreateProjectFormResult = ReturnType<typeof useCreateProjectForm>;
