"use client";

import { useTranslations } from "next-intl";
import { useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { CvFormValues } from "../cvs.types";
import { useCreateCv } from "../useCreateCv";
import { useCvForm } from "../useCvForm";
import { toCreateCvInput } from "../utils";

const EMPTY_VALUES: CvFormValues = { name: "", education: "", description: "" };

/**
 * The Create CV flow: the open state of the modal and the request. The form itself is `useCvForm`. It is
 * empty each time the modal opens. A failed request keeps every typed value and shows the error inside the
 * modal. Only a successful request closes the modal.
 * `userId` is the owner of the new CV on the User CVs tab. It comes from the page, not from the form.
 */
export function useCreateCvForm(userId?: string) {
  const t = useTranslations("cvs.create");
  const toast = useToast();
  const { create } = useCreateCv();
  const { form, failed, reset, showError, submit: submitForm } = useCvForm(EMPTY_VALUES);
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    reset(EMPTY_VALUES);
    setIsOpen(true);
  }

  async function send(values: CvFormValues) {
    try {
      await create(toCreateCvInput(values, userId));
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

export type UseCreateCvFormResult = ReturnType<typeof useCreateCvForm>;
