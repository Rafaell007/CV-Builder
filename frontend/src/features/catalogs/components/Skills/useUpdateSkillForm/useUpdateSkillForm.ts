"use client";

import { useTranslations } from "next-intl";
import { useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { SkillInput, SkillListItem } from "../skills.types";
import { useSkillForm } from "../useSkillForm";

/**
 * The Update skill flow: the skill that is being edited, the open state of the modal and the request. `open(skill)`
 * fills the form with its current name and category. A failed request keeps the typed values and shows the error
 * inside the modal. Only a successful request closes the modal and shows a success toast.
 * `update` sends the request for the id, resolves with the saved skill and rejects with its error.
 */
export function useUpdateSkillForm(
  update: (id: string, input: SkillInput) => Promise<SkillListItem>,
) {
  const t = useTranslations("catalogs.skills");
  const toast = useToast();
  const { form, failed, hasChanged, reset, showError, submit: submitForm } = useSkillForm();
  // The skill stays set while the modal fades out, so the request still has its id.
  const [skill, setSkill] = useState<SkillListItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function open(chosen: SkillListItem) {
    reset({ name: chosen.name, categoryId: chosen.category.id });
    setSkill(chosen);
    setIsOpen(true);
  }

  async function send(input: SkillInput) {
    if (!skill) return;
    try {
      const saved = await update(skill.id, input);
      setIsOpen(false);
      toast.success({
        title: t("update.success.title"),
        description: t("update.success.text", { name: saved.name }),
      });
    } catch (error) {
      // Nothing resets the form here, so the values stay.
      showError(error);
    }
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return { form, failed, hasChanged, skill, isOpen, open, setOpen: setIsOpen, submit };
}

export type UseUpdateSkillFormResult = ReturnType<typeof useUpdateSkillForm>;
