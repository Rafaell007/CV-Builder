"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, type BaseSyntheticEvent } from "react";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import type { CvFormValues } from "../cvs.types";
import { cvFormSchema } from "../utils";

// The fields the backend validates (`CreateCvInput`, `UpdateCvInput`); each one can show a server error inline.
const SERVER_FIELDS = ["name", "education", "description"] as const;

/**
 * The form that Create CV and Update CV share: the fields with their rules, the guard against a double
 * submit and the mapping of a failed request. A failed request keeps every typed value: `BAD_USER_INPUT`
 * field errors show under their field, anything else becomes one general message (`failed`).
 */
export function useCvForm(defaultValues: CvFormValues) {
  const t = useTranslations("cvs.form");
  const [failed, setFailed] = useState(false);

  // A ref changes at once: two submits in the same tick cannot both pass.
  const sending = useRef(false);

  const schema = useMemo(
    () =>
      cvFormSchema({
        nameRequired: t("errors.nameRequired"),
        nameTooLong: t("errors.nameTooLong"),
        educationRequired: t("errors.educationRequired"),
        educationTooLong: t("errors.educationTooLong"),
        descriptionRequired: t("errors.descriptionRequired"),
        descriptionTooLong: t("errors.descriptionTooLong"),
      }),
    [t],
  );
  const form = useZodForm<CvFormValues, CvFormValues>(schema, { defaultValues });

  /** Fills the form with `values` (they become the new "unchanged" state) and clears the general error. */
  function reset(values: CvFormValues) {
    form.reset(values);
    setFailed(false);
  }

  /** Shows a failed request: field errors under their field, anything else as the general message. */
  function showError(error: unknown) {
    const allShown = applyServerFieldErrors(error, form.setError, {
      fields: SERVER_FIELDS,
      getMessage: () => t("errors.serverInvalid"),
    });
    setFailed(!allShown);
  }

  /**
   * Validates, then calls `send` with the checked values. The guard runs when the form is submitted, not while
   * rendering: a second submit during the request is ignored. `send` must not throw; it calls `showError`.
   */
  async function submit(event: BaseSyntheticEvent, send: (values: CvFormValues) => Promise<void>) {
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

export type UseCvFormResult = ReturnType<typeof useCvForm>;
