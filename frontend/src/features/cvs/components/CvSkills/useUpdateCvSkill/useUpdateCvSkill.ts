"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { readFailure } from "@/shared/failures";
import { UpdateCvSkillDocument } from "@/shared/graphql";
import type { CvSkillItem, CvSkillMastery } from "../cvSkills.types";

/**
 * The Update skill flow: the open state of the modal, the chosen mastery and the `updateCvSkill` request
 * (AC-21 to AC-25). The skill itself cannot change (the Skill field is disabled), so the only value is the mastery.
 * SAVE is possible only when the mastery differs from the saved one: the page sends no request that changes nothing.
 * The list shows the new mastery when the backend has answered (the answer updates the cached skill). A failed
 * request keeps the chosen mastery. Only a successful request closes the modal.
 */
export function useUpdateCvSkill() {
  const t = useTranslations("cvs.skills.update");
  const toast = useToast();
  // `skill` stays set after the modal closes, so its fields do not change while the modal fades out.
  const [skill, setSkill] = useState<CvSkillItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mastery, setMastery] = useState<CvSkillMastery>("BEGINNER");
  const [error, setError] = useState<string | undefined>();
  const [updateCvSkill, { loading }] = useMutation(UpdateCvSkillDocument);

  // A ref changes at once, `loading` only after the next render: two calls in the same tick cannot both pass.
  const sending = useRef(false);

  const canSave = skill !== null && mastery !== skill.mastery && !loading;

  function open(chosen: CvSkillItem) {
    setSkill(chosen);
    setMastery(chosen.mastery);
    setError(undefined);
    setIsOpen(true);
  }

  function select(next: CvSkillMastery) {
    setMastery(next);
    setError(undefined);
  }

  async function submit() {
    if (skill === null || mastery === skill.mastery || sending.current) return;
    sending.current = true;
    try {
      await updateCvSkill({ variables: { input: { id: skill.id, mastery } } });
      setIsOpen(false);
      toast.success({
        title: t("success.title"),
        description: t("success.text", { name: skill.name }),
      });
    } catch (failure) {
      // Nothing resets the chosen mastery here, so the value stays.
      const { kind } = readFailure(failure);
      setError(t(`errors.${kind === "notFound" || kind === "forbidden" ? kind : "failed"}`));
    } finally {
      sending.current = false;
    }
  }

  return {
    isOpen,
    skill,
    mastery,
    open,
    setOpen: setIsOpen,
    select,
    submit,
    canSave,
    pending: loading,
    error,
  };
}

export type UseUpdateCvSkillResult = ReturnType<typeof useUpdateCvSkill>;
