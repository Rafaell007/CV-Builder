"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { readFailure } from "@/shared/failures";
import { AddCvSkillDocument, CvSkillsDocument } from "@/shared/graphql";
import { useAvailableCvSkills } from "../useAvailableCvSkills";
import type { CvSkillMastery } from "../cvSkills.types";

/** What can be wrong after a press on ADD. The first three belong to the Skill field, the others to the whole modal. */
type AddError = "required" | "conflict" | "invalid" | "notFound" | "forbidden" | "failed";

const FIELD_ERRORS: readonly AddError[] = ["required", "conflict", "invalid"];

// The kinds of `readFailure` with an own text. Every other kind shows the general `failed` text.
const OWN_TEXT_KINDS = ["notFound", "forbidden", "conflict", "invalid"] as const;

type MasteryChoice = CvSkillMastery | "";

/**
 * The Add skill flow: the open state of the modal, the chosen skill, the optional mastery, the options and the
 * `addCvSkill` request (AC-14 to AC-20). The options come from the backend (the skills of the CV owner that the CV
 * does not hold) and are loaded each time the modal opens. The mastery is optional (Figma shows the field): when the
 * user does not touch the field, the request has no mastery and the backend copies the level of the owner. When the
 * user chooses "No mastery", the request carries `NONE` and the skill has no level. A failed request keeps the chosen skill. Only a successful request closes the
 * modal; the skill appears in the list when the backend has answered and the list is loaded again.
 */
export function useAddCvSkill(cvId: string) {
  const t = useTranslations("cvs.skills.add");
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [skillId, setSkillId] = useState("");
  // "" is nothing chosen yet (no mastery is sent). NO_MASTERY is the user's choice of no level (NONE is sent).
  const [mastery, setMastery] = useState<MasteryChoice>("");
  const [error, setError] = useState<AddError | undefined>();
  const available = useAvailableCvSkills(cvId, isOpen);
  const [addCvSkill, { loading }] = useMutation(AddCvSkillDocument);

  // A ref changes at once, `loading` only after the next render: two calls in the same tick cannot both pass.
  const sending = useRef(false);

  function open() {
    setSkillId("");
    setMastery("");
    setError(undefined);
    setIsOpen(true);
  }

  function select(id: string) {
    setSkillId(id);
    setError(undefined);
  }

  /** `NO_MASTERY` is a level of its own: the field shows it and the request carries `NONE`. */
  function selectMastery(next: MasteryChoice) {
    setMastery(next);
    setError(undefined);
  }

  async function submit() {
    if (sending.current) return;
    if (skillId === "") {
      setError("required");
      return;
    }
    sending.current = true;
    try {
      const { data } = await addCvSkill({
        variables: { input: { cvId, skillId, ...(mastery !== "" && { mastery }) } },
        // The list loads again for the new skill; the backend decides its place in the category.
        refetchQueries: [CvSkillsDocument],
      });
      setIsOpen(false);
      toast.success({
        title: t("success.title"),
        description: t("success.text", { name: data?.addCvSkill.name ?? "" }),
      });
    } catch (failure) {
      const { kind } = readFailure(failure);
      // Nothing resets the chosen skill here, so the value stays.
      setError(OWN_TEXT_KINDS.find((item) => item === kind) ?? "failed");
      // The skill is already in the CV, or the owner lost it: the options are old, so load them again.
      if (kind === "conflict") available.retry();
    } finally {
      sending.current = false;
    }
  }

  const fieldError =
    error !== undefined && FIELD_ERRORS.includes(error) ? t(`errors.${error}`) : undefined;
  const generalError =
    error !== undefined && fieldError === undefined ? t(`errors.${error}`) : undefined;

  return {
    isOpen,
    open,
    setOpen: setIsOpen,
    skillId,
    select,
    mastery,
    selectMastery,
    submit,
    pending: loading,
    options: available.options,
    optionsLoading: available.loading,
    optionsFailed: available.failed,
    retryOptions: available.retry,
    fieldError,
    generalError,
  };
}

export type UseAddCvSkillResult = ReturnType<typeof useAddCvSkill>;
