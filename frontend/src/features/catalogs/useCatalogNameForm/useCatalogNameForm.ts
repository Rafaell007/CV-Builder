"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type BaseSyntheticEvent } from "react";
import { useWatch } from "react-hook-form";
import { useServerForm } from "@/shared/forms";
import type { CatalogNameFormValues, CatalogNamespace } from "../catalogs.types";
import { catalogNameSchema } from "../utils";

const EMPTY_VALUES: CatalogNameFormValues = { name: "" };

/**
 * The one-field name form that Create and Update share: the rule and the mapping of a failed request. A failed
 * request keeps the typed name: `CONFLICT` shows "… already exists" under the field, a `BAD_USER_INPUT` field error
 * shows under the field too, anything else becomes one general message (`failed`).
 * The guard against a double submit is in `useServerForm`.
 */
export function useCatalogNameForm(namespace: CatalogNamespace) {
  const t = useTranslations(namespace);
  // The trimmed name the form started with: a save is only worth sending when the trimmed name differs from it.
  const [original, setOriginal] = useState("");

  const schema = useMemo(
    () =>
      catalogNameSchema({
        nameRequired: t("form.errors.nameRequired"),
        nameTooLong: t("form.errors.nameTooLong"),
      }),
    [t],
  );
  const {
    form,
    generalError,
    reset: resetForm,
    showError,
    submit: submitForm,
  } = useServerForm(schema, {
    defaultValues: EMPTY_VALUES,
    serverFields: { fields: ["name"], getMessage: () => t("form.errors.serverInvalid") },
    placeFailure: ({ kind }) =>
      kind === "conflict"
        ? { show: "field", field: "name", message: t("form.errors.nameTaken") }
        : { show: "fieldErrors", otherwise: "failed" },
  });

  const typedName = useWatch({ control: form.control, name: "name" });
  /** True when the trimmed name differs from the one the form started with. "Foo" to "Foo " is not a change. */
  const hasChanged = typedName.trim() !== original;

  /** Fills the form with `name` (it becomes the new "unchanged" state) and clears the general error. */
  function reset(name: string) {
    resetForm({ name });
    setOriginal(name.trim());
  }

  /** Validates, then calls `send` with the trimmed name. An error that `send` throws is shown by the form. */
  async function submit(event: BaseSyntheticEvent, send: (name: string) => Promise<void>) {
    await submitForm(event, ({ name }) => send(name));
  }

  return { form, failed: generalError !== null, hasChanged, reset, showError, submit };
}

export type UseCatalogNameFormResult = ReturnType<typeof useCatalogNameForm>;
