"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, type BaseSyntheticEvent } from "react";
import { useWatch } from "react-hook-form";
import { readFailure } from "@/shared/failures";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import type { SkillFormValues, SkillInput } from "../skills.types";
import { skillFormSchema } from "../utils";

const NAMESPACE = "catalogs.skills";
const EMPTY_VALUES: SkillFormValues = { name: "", categoryId: "" };

/**
 * The skill form (name + category) that Create and Update share: the rules, the guard against a double submit and the
 * mapping of a failed request. A failed request keeps the typed values: `CONFLICT` shows "… already exists" under the
 * name, a `BAD_USER_INPUT` field error shows under its field (`categoryId`: the category no longer exists), anything
 * else becomes one general message (`failed`).
 */
export function useSkillForm() {
  const t = useTranslations(NAMESPACE);
  const [failed, setFailed] = useState(false);
  // The trimmed values the form started with: a save is only worth sending when one of them differs.
  const [original, setOriginal] = useState(EMPTY_VALUES);

  // A ref changes at once: two submits in the same tick cannot both pass.
  const sending = useRef(false);

  const schema = useMemo(
    () =>
      skillFormSchema({
        nameRequired: t("form.errors.nameRequired"),
        nameTooLong: t("form.errors.nameTooLong"),
        categoryRequired: t("form.errors.categoryRequired"),
      }),
    [t],
  );
  const form = useZodForm<SkillFormValues, SkillFormValues>(schema, {
    defaultValues: EMPTY_VALUES,
  });

  const typedName = useWatch({ control: form.control, name: "name" });
  const chosenCategoryId = useWatch({ control: form.control, name: "categoryId" });
  /** True when the trimmed name or the category differs from the start. "React" to "React " is not a change. */
  const hasChanged = typedName.trim() !== original.name || chosenCategoryId !== original.categoryId;

  /** Fills the form with `values` (they become the new "unchanged" state) and clears the general error. */
  function reset(values: SkillFormValues) {
    form.reset(values);
    setOriginal({ name: values.name.trim(), categoryId: values.categoryId });
    setFailed(false);
  }

  /** Shows a failed request: a taken name or a field error under its field, anything else as the general message. */
  function showError(error: unknown) {
    if (readFailure(error).kind === "conflict") {
      form.setError(
        "name",
        { type: "server", message: t("form.errors.nameTaken") },
        { shouldFocus: true },
      );
      setFailed(false);
      return;
    }
    const allShown = applyServerFieldErrors(error, form.setError, {
      fields: ["name", "categoryId"],
      getMessage: (field) =>
        field === "categoryId" ? t("form.errors.categoryNotFound") : t("form.errors.serverInvalid"),
    });
    setFailed(!allShown);
  }

  /**
   * Validates, then calls `send` with the trimmed name and the category. A second submit during the request is
   * ignored. `send` must not throw; it calls `showError`.
   */
  async function submit(event: BaseSyntheticEvent, send: (input: SkillInput) => Promise<void>) {
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

  return { form, failed, hasChanged, reset, showError, submit };
}

export type UseSkillFormResult = ReturnType<typeof useSkillForm>;
