"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { useServerForm } from "@/shared/forms";
import type { SkillFormValues } from "../skills.types";
import { skillFormSchema } from "../utils";

const NAMESPACE = "catalogs.skills";
const EMPTY_VALUES: SkillFormValues = { name: "", categoryId: "" };

/**
 * The skill form (name + category) that Create and Update share: the rules and the mapping of a failed
 * request. A failed request keeps the typed values: `CONFLICT` shows "… already exists" under the
 * name, a `BAD_USER_INPUT` field error shows under its field (`categoryId`: the category no longer exists), anything
 * else becomes one general message (`failed`). The guard against a double submit is in `useServerForm`.
 */
export function useSkillForm() {
  const t = useTranslations(NAMESPACE);
  // The trimmed values the form started with: a save is only worth sending when one of them differs.
  const [original, setOriginal] = useState(EMPTY_VALUES);

  const schema = useMemo(
    () =>
      skillFormSchema({
        nameRequired: t("form.errors.nameRequired"),
        nameTooLong: t("form.errors.nameTooLong"),
        categoryRequired: t("form.errors.categoryRequired"),
      }),
    [t],
  );
  const {
    form,
    generalError,
    reset: resetForm,
    showError,
    submit,
  } = useServerForm(schema, {
    defaultValues: EMPTY_VALUES,
    serverFields: {
      fields: ["name", "categoryId"],
      getMessage: (field) =>
        field === "categoryId" ? t("form.errors.categoryNotFound") : t("form.errors.serverInvalid"),
    },
    placeFailure: ({ kind }) =>
      kind === "conflict"
        ? { show: "field", field: "name", message: t("form.errors.nameTaken") }
        : { show: "fieldErrors", otherwise: "failed" },
  });

  const typedName = useWatch({ control: form.control, name: "name" });
  const chosenCategoryId = useWatch({ control: form.control, name: "categoryId" });
  /** True when the trimmed name or the category differs from the start. "React" to "React " is not a change. */
  const hasChanged = typedName.trim() !== original.name || chosenCategoryId !== original.categoryId;

  /** Fills the form with `values` (they become the new "unchanged" state) and clears the general error. */
  function reset(values: SkillFormValues) {
    resetForm(values);
    setOriginal({ name: values.name.trim(), categoryId: values.categoryId });
  }

  return { form, failed: generalError !== null, hasChanged, reset, showError, submit };
}

export type UseSkillFormResult = ReturnType<typeof useSkillForm>;
