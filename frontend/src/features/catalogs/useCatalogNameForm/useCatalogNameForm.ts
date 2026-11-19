"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, type BaseSyntheticEvent } from "react";
import { useWatch } from "react-hook-form";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import type { CatalogNameFormValues, CatalogNamespace } from "../catalogs.types";
import { catalogNameSchema, isCatalogConflict } from "../utils";

const EMPTY_VALUES: CatalogNameFormValues = { name: "" };

/**
 * The one-field name form that Create and Update share: the rule, the guard against a double submit and the mapping
 * of a failed request. A failed request keeps the typed name: `CONFLICT` shows "… already exists" under the field,
 * a `BAD_USER_INPUT` field error shows under the field too, anything else becomes one general message (`failed`).
 */
export function useCatalogNameForm(namespace: CatalogNamespace) {
  const t = useTranslations(namespace);
  const [failed, setFailed] = useState(false);
  // The trimmed name the form started with: a save is only worth sending when the trimmed name differs from it.
  const [original, setOriginal] = useState("");

  // A ref changes at once: two submits in the same tick cannot both pass.
  const sending = useRef(false);

  const schema = useMemo(
    () =>
      catalogNameSchema({
        nameRequired: t("form.errors.nameRequired"),
        nameTooLong: t("form.errors.nameTooLong"),
      }),
    [t],
  );
  const form = useZodForm<CatalogNameFormValues, CatalogNameFormValues>(schema, {
    defaultValues: EMPTY_VALUES,
  });

  const typedName = useWatch({ control: form.control, name: "name" });
  /** True when the trimmed name differs from the one the form started with. "Foo" to "Foo " is not a change. */
  const hasChanged = typedName.trim() !== original;

  /** Fills the form with `name` (it becomes the new "unchanged" state) and clears the general error. */
  function reset(name: string) {
    form.reset({ name });
    setOriginal(name.trim());
    setFailed(false);
  }

  /** Shows a failed request: a taken name or a field error under the field, anything else as the general message. */
  function showError(error: unknown) {
    if (isCatalogConflict(error)) {
      form.setError(
        "name",
        { type: "server", message: t("form.errors.nameTaken") },
        { shouldFocus: true },
      );
      setFailed(false);
      return;
    }
    const allShown = applyServerFieldErrors(error, form.setError, {
      fields: ["name"],
      getMessage: () => t("form.errors.serverInvalid"),
    });
    setFailed(!allShown);
  }

  /**
   * Validates, then calls `send` with the trimmed name. A second submit during the request is ignored.
   * `send` must not throw; it calls `showError`.
   */
  async function submit(event: BaseSyntheticEvent, send: (name: string) => Promise<void>) {
    if (sending.current) return;
    sending.current = true;
    try {
      await form.handleSubmit(async ({ name }) => {
        setFailed(false);
        await send(name);
      })(event);
    } finally {
      sending.current = false;
    }
  }

  return { form, failed, hasChanged, reset, showError, submit };
}

export type UseCatalogNameFormResult = ReturnType<typeof useCatalogNameForm>;
