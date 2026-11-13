"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, type BaseSyntheticEvent } from "react";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import type { CvProjectFormSubmit, CvProjectFormValues, ProjectRange } from "../cvProjects.types";
import {
  cvProjectFormSchema,
  EMPTY_CV_PROJECT_FORM_VALUES,
  toCvProjectFailure,
  type CvProjectFailure,
} from "../utils";

// The fields the backend validates (`AddCvProjectInput`, `UpdateCvProjectInput`); each one can show a server error inline.
const SERVER_FIELDS = ["projectId", "startDate", "endDate", "roleIds", "responsibilities"] as const;

type FormError = CvProjectFailure | "failed";

/**
 * The form that Add project and Update project share (page 23: "Validation rules are identical to Add Project"):
 * the fields with their rules, the guard against a double submit and the mapping of a failed request.
 * A failed request keeps every typed value: `BAD_USER_INPUT` field errors show under their field, anything else
 * becomes one general message (`error`). `rangeOf` gives the days of a project; it must stay the same function
 * until the catalog changes, because a new function builds the rules again.
 */
export function useCvProjectForm(rangeOf: (projectId: string) => ProjectRange | undefined) {
  const t = useTranslations("cvs.projects.form.errors");
  const [error, setError] = useState<FormError | undefined>();

  // A ref changes at once: two submits in the same tick cannot both pass (page 23, Mutation States).
  const sending = useRef(false);

  const schema = useMemo(
    () =>
      cvProjectFormSchema(
        {
          projectRequired: t("projectRequired"),
          startDateRequired: t("startDateRequired"),
          startDateOutOfRange: t("startDateOutOfRange"),
          endDateOutOfRange: t("endDateOutOfRange"),
          endDateBeforeStart: t("endDateBeforeStart"),
          rolesRequired: t("rolesRequired"),
          rolesTooMany: t("rolesTooMany"),
          responsibilitiesTooLong: t("responsibilitiesTooLong"),
        },
        rangeOf,
      ),
    [t, rangeOf],
  );
  const form = useZodForm<CvProjectFormValues, CvProjectFormSubmit>(schema, {
    defaultValues: EMPTY_CV_PROJECT_FORM_VALUES,
  });

  /** Fills the form with `values` (they become the new "unchanged" state) and clears the general error. */
  function reset(values: CvProjectFormValues) {
    form.reset(values);
    setError(undefined);
  }

  /** Shows a failed request: field errors under their field, anything else as the general message. */
  function showError(failure: unknown) {
    const allShown = applyServerFieldErrors(failure, form.setError, {
      fields: SERVER_FIELDS,
      getMessage: (field) => {
        switch (field) {
          case "projectId":
            return t("server.projectId");
          case "startDate":
            return t("server.startDate");
          case "endDate":
            return t("server.endDate");
          case "roleIds":
            return t("server.roleIds");
          default:
            return t("server.responsibilities");
        }
      },
    });
    setError(allShown ? undefined : (toCvProjectFailure(failure) ?? "failed"));
  }

  /**
   * Validates, then calls `send` with the checked values. The guard runs when the form is submitted, not while
   * rendering: a second submit during the request is ignored. `send` must not throw; it calls `showError`.
   */
  async function submit(
    event: BaseSyntheticEvent,
    send: (values: CvProjectFormSubmit) => Promise<void>,
  ) {
    if (sending.current) return;
    sending.current = true;
    try {
      await form.handleSubmit(async (values) => {
        setError(undefined);
        await send(values);
      })(event);
    } finally {
      sending.current = false;
    }
  }

  return { form, error: error === undefined ? undefined : t(error), reset, showError, submit };
}

export type UseCvProjectFormResult = ReturnType<typeof useCvProjectForm>;
