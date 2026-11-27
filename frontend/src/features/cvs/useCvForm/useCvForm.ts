"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useServerForm } from "@/shared/forms";
import type { CvFormValues } from "../cvs.types";
import { cvFormSchema } from "../utils";

// The fields the backend validates (`CreateCvInput`, `UpdateCvInput`); each one can show a server error inline.
const SERVER_FIELDS = ["name", "education", "description"] as const;

/**
 * The form that Create CV and Update CV share: the fields with their rules. A failed request keeps every typed
 * value: `BAD_USER_INPUT` field errors show under their field, anything else becomes one general message (`failed`).
 * The guard against a double submit is in `useServerForm`.
 */
export function useCvForm(defaultValues: CvFormValues) {
  const t = useTranslations("cvs.form");

  const schema = useMemo(
    () =>
      cvFormSchema({
        nameRequired: t("errors.nameRequired"),
        nameTooLong: t("errors.nameTooLong"),
        educationRequired: t("errors.educationRequired"),
        educationTooLong: t("errors.educationTooLong"),
        descriptionRequired: t("errors.descriptionRequired"),
        descriptionTooLong: t("errors.descriptionTooLong"),
      }),
    [t],
  );
  const { form, generalError, reset, showError, submit } = useServerForm(schema, {
    defaultValues,
    serverFields: { fields: SERVER_FIELDS, getMessage: () => t("errors.serverInvalid") },
  });

  return { form, failed: generalError !== null, reset, showError, submit };
}

export type UseCvFormResult = ReturnType<typeof useCvForm>;
