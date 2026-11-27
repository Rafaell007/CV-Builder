"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { useServerForm } from "@/shared/forms";
import { ISO_TAKEN_REASON } from "../languages.constants";
import type { LanguageFormValues } from "../languages.types";
import { languageFormSchema, normalizeIso } from "../utils";

const NAMESPACE = "catalogs.languages";
const EMPTY_VALUES: LanguageFormValues = { name: "", iso: "", nativeName: "" };

/**
 * The values as they are compared: trimmed, the ISO code uppercase, each run of whitespace in the name one space (like
 * the backend `NormalizeSpaces`, so "New  York" for "New York" is not a change).
 */
function normalize(values: LanguageFormValues): LanguageFormValues {
  return {
    name: values.name.trim().replace(/\s+/g, " "),
    iso: normalizeIso(values.iso),
    nativeName: values.nativeName.trim(),
  };
}

/**
 * The language form (name, ISO code, native name) that Create and Update share: the rules and the mapping of a failed
 * request. A failed request keeps the typed values: `CONFLICT` with reason
 * `ISO_TAKEN` shows "ISO code already exists" under the ISO code, any other `CONFLICT` "Language already exists" under
 * the name, a `BAD_USER_INPUT` field error shows under its field, anything else becomes one general message (`failed`).
 * The guard against a double submit is in `useServerForm`.
 */
export function useLanguageForm() {
  const t = useTranslations(NAMESPACE);
  // The normalized values the form started with: a save is only worth sending when one of them differs.
  const [original, setOriginal] = useState(EMPTY_VALUES);

  const schema = useMemo(
    () =>
      languageFormSchema({
        nameRequired: t("form.errors.nameRequired"),
        nameTooLong: t("form.errors.nameTooLong"),
        isoRequired: t("form.errors.isoRequired"),
        isoTooLong: t("form.errors.isoTooLong"),
        isoInvalid: t("form.errors.isoInvalid"),
        nativeNameRequired: t("form.errors.nativeNameRequired"),
        nativeNameTooLong: t("form.errors.nativeNameTooLong"),
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
      fields: ["name", "iso", "nativeName"],
      getMessage: () => t("form.errors.serverInvalid"),
    },
    placeFailure: ({ kind, reason }) => {
      if (kind === "conflict" && reason === ISO_TAKEN_REASON) {
        return { show: "field", field: "iso", message: t("form.errors.isoTaken") };
      }
      if (kind === "conflict") {
        return { show: "field", field: "name", message: t("form.errors.nameTaken") };
      }
      return { show: "fieldErrors", otherwise: "failed" };
    },
  });

  const [name, iso, nativeName] = useWatch({
    control: form.control,
    name: ["name", "iso", "nativeName"],
  });
  const typed = normalize({ name, iso, nativeName });
  /** True when a normalized value differs from the start. "en " for "EN" is not a change. */
  const hasChanged =
    typed.name !== original.name ||
    typed.iso !== original.iso ||
    typed.nativeName !== original.nativeName;

  /** Fills the form with `values` (they become the new "unchanged" state) and clears the general error. */
  function reset(values: LanguageFormValues) {
    resetForm(values);
    setOriginal(normalize(values));
  }

  return { form, failed: generalError !== null, hasChanged, reset, showError, submit };
}

export type UseLanguageFormResult = ReturnType<typeof useLanguageForm>;
