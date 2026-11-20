"use client";

import { useTranslations } from "next-intl";
import { useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { SkillInput, SkillListItem } from "../skills.types";
import { useSkillForm } from "../useSkillForm";

/**
 * The Create skill flow: the open state of the modal and the request. The form is empty each time the modal opens.
 * A failed request keeps the typed values and shows the error inside the modal. Only a successful request closes the
 * modal and shows a success toast. `create` sends the request, resolves with the saved skill and rejects with its error.
 */
export function useCreateSkillForm(create: (input: SkillInput) => Promise<SkillListItem>) {
  const t = useTranslations("catalogs.skills");
  const toast = useToast();
  const { form, failed, hasChanged, reset, showError, submit: submitForm } = useSkillForm();
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    reset({ name: "", categoryId: "" });
    setIsOpen(true);
  }

  async function send(input: SkillInput) {
    try {
      const created = await create(input);
      setIsOpen(false);
      toast.success({
        title: t("create.success.title"),
        description: t("create.success.text", { name: created.name }),
      });
    } catch (error) {
      // Nothing resets the form here, so the values stay.
      showError(error);
    }
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return { form, failed, hasChanged, isOpen, open, setOpen: setIsOpen, submit };
}

export type UseCreateSkillFormResult = ReturnType<typeof useCreateSkillForm>;
