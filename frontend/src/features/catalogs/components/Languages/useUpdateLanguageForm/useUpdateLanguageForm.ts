"use client";

import { useTranslations } from "next-intl";
import { useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { LanguageInput, LanguageListItem } from "../languages.types";
import { useLanguageForm } from "../useLanguageForm";

/**
 * The Update language flow: the language that is being edited, the open state of the modal and the request.
 * `open(language)` fills the form with its current name, ISO code and native name. A failed request keeps the typed
 * values and shows the error inside the modal. Only a successful request closes the modal and shows a success toast.
 * `update` sends the request for the id, resolves with the saved language and rejects with its error.
 */
export function useUpdateLanguageForm(
  update: (id: string, input: LanguageInput) => Promise<LanguageListItem>,
) {
  const t = useTranslations("catalogs.languages");
  const toast = useToast();
  const { form, failed, hasChanged, reset, submit: submitForm } = useLanguageForm();
  // The language stays set while the modal fades out, so the request still has its id.
  const [language, setLanguage] = useState<LanguageListItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function open(chosen: LanguageListItem) {
    reset({ name: chosen.name, iso: chosen.iso, nativeName: chosen.nativeName });
    setLanguage(chosen);
    setIsOpen(true);
  }

  async function send(input: LanguageInput) {
    if (!language) return;
    const saved = await update(language.id, input);
    setIsOpen(false);
    toast.success({
      title: t("update.success.title"),
      description: t("update.success.text", { name: saved.name }),
    });
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return { form, failed, hasChanged, language, isOpen, open, setOpen: setIsOpen, submit };
}

export type UseUpdateLanguageFormResult = ReturnType<typeof useUpdateLanguageForm>;
