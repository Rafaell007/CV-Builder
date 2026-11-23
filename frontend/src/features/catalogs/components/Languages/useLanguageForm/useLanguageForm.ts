"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState, type BaseSyntheticEvent } from "react";
import { useWatch } from "react-hook-form";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import { isCatalogConflict } from "../../../utils";
import type { LanguageFormValues, LanguageInput } from "../languages.types";
import { isIsoTaken, languageFormSchema, normalizeIso } from "../utils";

const NAMESPACE = "catalogs.languages";
const EMPTY_VALUES: LanguageFormValues = { name: "", iso: "", nativeName: "" };

/** The values as they are sent and compared: trimmed, the ISO code uppercase. */
function normalize(values: LanguageFormValues): LanguageFormValues {
  return {
    name: values.name.trim(),
    iso: normalizeIso(values.iso),
    nativeName: values.nativeName.trim(),
  };
}

/**
 * The language form (name, ISO code, native name) that Create and Update share: the rules, the guard against a double
 * submit and the mapping of a failed request. A failed request keeps the typed values: `CONFLICT` with reason
 * `ISO_TAKEN` shows "ISO code already exists" under the ISO code, any other `CONFLICT` "Language already exists" under
 * the name, a `BAD_USER_INPUT` field error shows under its field, anything else becomes one general message (`failed`).
 */
export function useLanguageForm() {
  const t = useTranslations(NAMESPACE);
  const [failed, setFailed] = useState(false);
  // The normalized values the form started with: a save is only worth sending when one of them differs.
  const [original, setOriginal] = useState(EMPTY_VALUES);

  // A ref changes at once: two submits in the same tick cannot both pass.
  const sending = useRef(false);

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
  const form = useZodForm<LanguageFormValues, LanguageFormValues>(schema, {
    defaultValues: EMPTY_VALUES,
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
    form.reset(values);
    setOriginal(normalize(values));
    setFailed(false);
  }

  /** Shows a failed request: a taken ISO code or name or a field error under its field, anything else as the general message. */
  function showError(error: unknown) {
    if (isIsoTaken(error)) {
      form.setError(
        "iso",
        { type: "server", message: t("form.errors.isoTaken") },
        { shouldFocus: true },
      );
      setFailed(false);
      return;
    }
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
      fields: ["name", "iso", "nativeName"],
      getMessage: () => t("form.errors.serverInvalid"),
    });
    setFailed(!allShown);
  }

  /**
   * Validates, then calls `send` with the trimmed values and the uppercase ISO code. A second submit during the
   * request is ignored. `send` must not throw; it calls `showError`.
   */
  async function submit(event: BaseSyntheticEvent, send: (input: LanguageInput) => Promise<void>) {
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

export type UseLanguageFormResult = ReturnType<typeof useLanguageForm>;
