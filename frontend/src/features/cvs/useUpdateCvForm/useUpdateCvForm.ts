"use client";

import { useTranslations } from "next-intl";
import { useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { CvFormValues, CvListItem } from "../cvs.types";
import { useCvForm } from "../useCvForm";
import { useUpdateCv } from "../useUpdateCv";
import { toCvFormValues, toUpdateCvInput } from "../utils";

// The form needs values before a CV is chosen; `open` replaces them with the data of the CV.
const EMPTY_VALUES: CvFormValues = { name: "", education: "", description: "" };

/**
 * The Update CV flow: the CV that is being edited, the open state of the modal and the request. The form
 * itself is `useCvForm`. `open(cv)` fills it with the current data of that CV. A failed request keeps every
 * typed value and shows the error inside the modal. Only a successful request closes the modal.
 */
export function useUpdateCvForm() {
  const t = useTranslations("cvs.update");
  const toast = useToast();
  const { update } = useUpdateCv();
  const { form, failed, reset, showError, submit: submitForm } = useCvForm(EMPTY_VALUES);
  // The CV stays set while the modal fades out, so the request still has its id.
  const [cv, setCv] = useState<CvListItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function open(chosen: CvListItem) {
    reset(toCvFormValues(chosen));
    setCv(chosen);
    setIsOpen(true);
  }

  async function send(values: CvFormValues) {
    if (!cv) return;
    try {
      await update(toUpdateCvInput(cv, values));
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

export type UseUpdateCvFormResult = ReturnType<typeof useUpdateCvForm>;
