"use client";

import { useTranslations } from "next-intl";
import type { BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { CvDetailsData, CvFormValues } from "../cvs.types";
import { useCvForm } from "../useCvForm";
import { useUpdateCv } from "../useUpdateCv";
import { toCvFormValues, toUpdateCvInput } from "../utils";

/**
 * The form of the CV Details page: the fields of the loaded CV and the UPDATE action. The form itself is
 * `useCvForm`. `canUpdate` is true only when the form is valid, differs from the saved CV and no request runs.
 * A failed request keeps every typed value and the changed state. A successful request makes the saved data
 * of the backend the new "unchanged" state, so UPDATE is disabled again and the values stay visible.
 */
export function useCvDetailsForm(cv: CvDetailsData) {
  const t = useTranslations("cvs.update");
  const toast = useToast();
  const { update } = useUpdateCv();
  const { form, failed, reset, submit: submitForm } = useCvForm(toCvFormValues(cv));
  const { isValid, isDirty, isSubmitting } = form.formState;

  async function send(values: CvFormValues) {
    const saved = await update(toUpdateCvInput(cv, values));
    // Only now, after the backend confirmed the save, do the saved values become the unchanged state.
    reset(toCvFormValues(saved));
    toast.success({
      title: t("success.title"),
      description: t("success.text", { name: saved.name }),
    });
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return { form, failed, submit, canUpdate: isValid && isDirty && !isSubmitting, isSubmitting };
}

export type UseCvDetailsFormResult = ReturnType<typeof useCvDetailsForm>;
