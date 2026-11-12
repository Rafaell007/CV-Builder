"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import type { CreateProjectSubmit, CreateProjectValues } from "../projects.types";
import { useCreateProject } from "../useCreateProject";
import { createProjectSchema, toCreateProjectInput } from "../utils";

const EMPTY_VALUES: CreateProjectValues = {
  name: "",
  domain: "",
  startDate: null,
  endDate: null,
  description: "",
};

// The fields the backend validates (`CreateProjectInput`); each one can show a server error inline.
const SERVER_FIELDS = ["name", "domain", "startDate", "endDate", "description"] as const;

/**
 * The Create project flow (page 27, Create Project): the open state of the modal, the form with its rules,
 * and the request. The form is empty each time the modal opens. A failed request keeps every typed value and
 * shows the error inside the modal: field errors (`BAD_USER_INPUT`) under their field, anything else as one
 * general message (`failed`). Only a successful request closes the modal.
 */
export function useCreateProjectForm() {
  const t = useTranslations("projects.create");
  const toast = useToast();
  const { create } = useCreateProject();
  const [isOpen, setIsOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  // A ref changes at once: two submits in the same tick cannot both pass (page 27, Loading State).
  const sending = useRef(false);

  const schema = useMemo(
    () =>
      createProjectSchema({
        nameRequired: t("errors.nameRequired"),
        nameTooLong: t("errors.nameTooLong"),
        domainRequired: t("errors.domainRequired"),
        domainTooLong: t("errors.domainTooLong"),
        startDateRequired: t("errors.startDateRequired"),
        endDateRequired: t("errors.endDateRequired"),
        endDateBeforeStart: t("errors.endDateBeforeStart"),
        descriptionRequired: t("errors.descriptionRequired"),
        descriptionTooLong: t("errors.descriptionTooLong"),
      }),
    [t],
  );
  const form = useZodForm<CreateProjectValues, CreateProjectSubmit>(schema, {
    defaultValues: EMPTY_VALUES,
  });

  function open() {
    form.reset(EMPTY_VALUES);
    setFailed(false);
    setIsOpen(true);
  }

  async function send(values: CreateProjectSubmit) {
    setFailed(false);
    try {
      await create(toCreateProjectInput(values));
      setIsOpen(false);
      toast.success({
        title: t("success.title"),
        description: t("success.text", { name: values.name }),
      });
    } catch (error) {
      // Nothing resets the form here, so the values stay.
      const allShown = applyServerFieldErrors(error, form.setError, {
        fields: SERVER_FIELDS,
        getMessage: (field) =>
          field === "endDate" ? t("errors.endDateBeforeStart") : t("errors.serverInvalid"),
      });
      setFailed(!allShown);
    }
  }

  // The guard runs when the form is submitted, not while rendering. A second submit during the request is ignored.
  async function submit(event: BaseSyntheticEvent) {
    if (sending.current) return;
    sending.current = true;
    try {
      await form.handleSubmit(send)(event);
    } finally {
      sending.current = false;
    }
  }

  return { form, isOpen, open, setOpen: setIsOpen, submit, failed };
}

export type UseCreateProjectFormResult = ReturnType<typeof useCreateProjectForm>;
