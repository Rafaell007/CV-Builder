"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, type BaseSyntheticEvent } from "react";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import type { ProjectFormSubmit, ProjectFormValues } from "../projects.types";
import { projectFormSchema } from "../utils";

// The fields the backend validates (`CreateProjectInput`, `UpdateProjectInput`); each one can show a server error inline.
const SERVER_FIELDS = [
  "name",
  "domain",
  "startDate",
  "endDate",
  "description",
  "environmentIds",
] as const;

/**
 * The form that Create project and Update project share (page 27: "Same validation rules as Create Project"):
 * the fields with their rules, the guard against a double submit and the mapping of a failed request.
 * A failed request keeps every typed value: `BAD_USER_INPUT` field errors show under their field, anything else
 * becomes one general message (`failed`).
 */
export function useProjectForm(defaultValues: ProjectFormValues) {
  const t = useTranslations("projects.form");
  const [failed, setFailed] = useState(false);

  // A ref changes at once: two submits in the same tick cannot both pass (page 27, Loading State).
  const sending = useRef(false);

  const schema = useMemo(
    () =>
      projectFormSchema({
        nameRequired: t("errors.nameRequired"),
        nameTooLong: t("errors.nameTooLong"),
        domainRequired: t("errors.domainRequired"),
        domainTooLong: t("errors.domainTooLong"),
        startDateRequired: t("errors.startDateRequired"),
        endDateRequired: t("errors.endDateRequired"),
        endDateBeforeStart: t("errors.endDateBeforeStart"),
        descriptionRequired: t("errors.descriptionRequired"),
        descriptionTooLong: t("errors.descriptionTooLong"),
        environmentTooMany: t("errors.environmentTooMany"),
        environmentDuplicate: t("errors.environmentDuplicate"),
      }),
    [t],
  );
  const form = useZodForm<ProjectFormValues, ProjectFormSubmit>(schema, { defaultValues });

  /** Fills the form with `values` (they become the new "unchanged" state) and clears the general error. */
  function reset(values: ProjectFormValues) {
    form.reset(values);
    setFailed(false);
  }

  /** Shows a failed request: field errors under their field, anything else as the general message. */
  function showError(error: unknown) {
    const allShown = applyServerFieldErrors(error, form.setError, {
      fields: SERVER_FIELDS,
      getMessage: (field) =>
        field === "endDate" ? t("errors.endDateBeforeStart") : t("errors.serverInvalid"),
    });
    setFailed(!allShown);
  }

  /**
   * Validates, then calls `send` with the checked values. The guard runs when the form is submitted, not while
   * rendering: a second submit during the request is ignored. `send` must not throw; it calls `showError`.
   */
  async function submit(
    event: BaseSyntheticEvent,
    send: (values: ProjectFormSubmit) => Promise<void>,
  ) {
    if (sending.current) return;
    sending.current = true;
    try {
      await form.handleSubmit(async (values) => {
        setFailed(false);
        await send(values);
      })(event);
    } finally {
      sending.current = false;
    }
  }

  return { form, failed, reset, showError, submit };
}

export type UseProjectFormResult = ReturnType<typeof useProjectForm>;
