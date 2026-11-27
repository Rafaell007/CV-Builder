"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useServerForm } from "@/shared/forms";
import type { ProjectFormSubmit, ProjectFormValues } from "../projects.types";
import { projectFormSchema } from "../utils";

// The fields the backend validates (`CreateProjectInput`, `UpdateProjectInput`); each one can show a server error inline.
const SERVER_FIELDS = [
  "name",
  "domain",
  "startDate",
  "endDate",
  "description",
  "environmentIds",
] as const;

/**
 * The form that Create project and Update project share (page 27: "Same validation rules as Create Project"):
 * the fields with their rules and the mapping of a failed request.
 * A failed request keeps every typed value: `BAD_USER_INPUT` field errors show under their field, anything else
 * becomes one general message (`failed`).
 * The guard against a double submit is in `useServerForm`.
 */
export function useProjectForm(defaultValues: ProjectFormValues) {
  const t = useTranslations("projects.form");

  const schema = useMemo(
    () =>
      projectFormSchema({
        nameRequired: t("errors.nameRequired"),
        nameTooLong: t("errors.nameTooLong"),
        domainRequired: t("errors.domainRequired"),
        domainTooLong: t("errors.domainTooLong"),
        startDateRequired: t("errors.startDateRequired"),
        endDateRequired: t("errors.endDateRequired"),
        endDateBeforeStart: t("errors.endDateBeforeStart"),
        descriptionRequired: t("errors.descriptionRequired"),
        descriptionTooLong: t("errors.descriptionTooLong"),
        environmentTooMany: t("errors.environmentTooMany"),
        environmentDuplicate: t("errors.environmentDuplicate"),
      }),
    [t],
  );
  const { form, generalError, reset, showError, submit } = useServerForm<
    ProjectFormValues,
    ProjectFormSubmit
  >(schema, {
    defaultValues,
    serverFields: {
      fields: SERVER_FIELDS,
      getMessage: (field) =>
        field === "endDate" ? t("errors.endDateBeforeStart") : t("errors.serverInvalid"),
    },
  });

  return { form, failed: generalError !== null, reset, showError, submit };
}

export type UseProjectFormResult = ReturnType<typeof useProjectForm>;
